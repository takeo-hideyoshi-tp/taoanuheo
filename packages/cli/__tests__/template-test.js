const { transform, evalClass, getPropsStyle } = require('./utils/utils');
let q = require('../packages/translator/queue');
const prettifyXml = require('prettify-xml');

describe('Template', () => {
  describe('inline style', () => {
    test('简单情况', () => {
      let code = transform(
        `return (
                  <div style={{color: 'red'}}></div>
                )`
      );

      let inst = evalClass(code);
      expect(getPropsStyle(inst.data.props)).toMatch(`color: red`);
    });

    test('style 有 - 符号', () => {
      let code = transform(
        `return (
                  <div style={{'fontSize': '16px'}}></div>
                )`
      );

      let inst = evalClass(code);
      expect(getPropsStyle(inst.data.props)).toMatch(`font-size: 16rpx`);
    });

    test('多个对象', () => {
      let code = transform(
        `return (
                  <div style={{marginTop: '10rpx', fontSize: '13px', lineHeight: '25px' }}></div>
                )`
      );

      let inst = evalClass(code);
      expect(getPropsStyle(inst.data.props)).toMatch(
        `margin-top: 10rpx;font-size: 13rpx;line-height: 25rpx`
      );
    });

    test('不转换字符串', () => {
      let code = transform(
        `return (
                  <div style='color: red'></div>
                )`
      );

      let template = q.wxml[q.wxml.length - 1].code;
      expect(template).toMatch(prettifyXml(`<view style=\"color: red\"></view>`));
    });

    test('不转换字符串想加', () => {
      let code = transform(
        `return (
                  <div style={'color:' + 'red'}></div>
                )`
      );

      let template = q.wxml[q.wxml.length - 1].code;
      expect(template).toMatch(prettifyXml(`<view style="{{'color:' + 'red'}}"></view>`));
    });
    test('style state 变量', () => {
      let code = transform(
        `return (
              <div style={{ zIndex: this.state.studyTip === 0 ? 3 : 1 }}></div>
            )`,
        `studyTip: 0`
      );

      let inst = evalClass(code);
      expect(getPropsStyle(inst.data.props)).toMatch(`z-index: 3`);
    });

    test('能在循环中使用', () => {
      let code = transform(
        `return (
              <div class="loop3-container">
              {this.state.array1.map(function(el) {
                return (
                  <div key={el.name}>
                    <div class="index-item-1" style={{ backgroundColor: '#eee' }}>
                      {el.name}
                    </div>
                  </div>
                );
              })}
              </div>
          )`,
        `array1: [
              {
                name: "动物1"
              },
              {
                name: "动物2"
              },
              {
                name: "动物3"
              }
            ]`
      );
      let inst = evalClass(code);
      expect(getPropsStyle(inst.data.props)).toMatch(`background-color: #eee`);
    });

    test('能在多重循环中使用', () => {
      let code = transform(
        `return (
              <div class="loop3-container">
              {this.state.array1.map(function(el) {
                return (
                  <div key={el.name}>
                    <div class="index-item-1" >
                      {el.name}
                    </div>
                    {this.state.array2.map(function(item) {
                      return (
                        <div key={item.name}>
                          <div class="index-item-2">
                            {item.name}
                          </div>
                          {this.state.array3.map(function(key) {
                            return (
                              <div
                                key={key.name}
                                class="index-item-3"
                                style={{ backgroundColor: '#ddd' }}
                              >
                                {key.name}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )`,
        ` array1: [
              {
                name: "动物1"
              },
              {
                name: "动物2"
              },
              {
                name: "动物3"
              }
            ],
            array2: [
              {
                name: "猫1"
              },
              {
                name: "狗2"
              },
              {
                name: "兔3"
              }
            ],
            array3: [
              {
                name: "小猫1"
              },
              {
                name: "小狗2"
              },
              {
                name: "小兔子3"
              }
            ]`
      );
      let inst = evalClass(code);
      expect(getPropsStyle(inst.data.props)).toMatch(`background-color: #ddd`);
    });

    test('style object 变量', () => {
      let code = transform(
        `return (
              <div style={formItemStyle}></div>
            )`,
        ``,
        `const formItemStyle = {
              marginBottom: '10px',
              textAlign: 'center',
              padding: '10px 10px 10px 10px',
              fontWeight: 'bold'
            };`
      );

      let inst = evalClass(code);
      expect(getPropsStyle(inst.data.props)).toMatch(
        `margin-bottom: 10rpx;text-align: center;padding: 10rpx 10rpx 10rpx 10rpx;font-weight: bold`
      );
    });
  });

  describe('使用 [] 获取成员表达式', () => {
    test('可以直接使用 this.state ', () => {
      let code = transform(
        `return (
                    <div>{this.state.list[this.state.index]}</div>
                  )`,
        `list: ['a', 'b','c'], index: 0`
      );

      let template = q.wxml[q.wxml.length - 1].code;
      expect(template).toMatch(prettifyXml(`<view>{{state.list[state.index]}}</view>`));
    });

    test('可以使用 this.props ', () => {
      let code = transform(
        `return (
                      <div>{this.state.list[this.props.index]}</div>
                    )`,
        `list: ['a', 'b','c'], index: 0`
      );

      let template = q.wxml[q.wxml.length - 1].code;
      expect(template).toMatch(prettifyXml(`<view>{{state.list[props.index]}}</view>`));
    });
  });

  describe('大小写', () => {
    test('单驼峰内置组件', () => {
      let code = transform(
        `return (<Dog>{this.state.list[this.state.index]}</Dog>)`
      );

      let template = q.wxml[q.wxml.length - 1].code;
      expect(template).toMatch(prettifyXml(`<view>{{state.list[state.index]}}</view>`));
    });

    test('双驼峰内置组件', () => {
        let code = transform(
          `return (<ScrollView>{this.state.list[this.state.index]}</ScrollView>)`
        );
  
        let template = q.wxml[q.wxml.length - 1].code;
        console.log('template', template)
        expect(template).toMatch(prettifyXml(`<view>{{state.list[state.index]}}</view>`));
      });
  });

});

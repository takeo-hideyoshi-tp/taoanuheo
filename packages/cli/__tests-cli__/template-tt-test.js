const { getXml } = require('./utils/utils');
const prettifyXml = require('prettify-xml');
const BUILD_TYPE = 'tt';

describe('属性模版测试 -tt', () => {
  
    test('className1 -tt', async() => {

        let code = 'return <div class={this.state.flag === \'checked\' ? \'checked\' : \'\'}></div>';
        let templateWX = await getXml(code, BUILD_TYPE);

        expect(prettifyXml(templateWX)).toMatch(
            prettifyXml(
                '<view class="{{state.flag === \'checked\' ? \'checked\' : \'\'}}"></view>'
            ));
    });

    test('className2 -tt', async() => {

        let code = 'return <div class={\'aaa \'+ (this.state.isOk && this.state.flag === \'checked\' ? \'checked\' : \'\') }></div>';
        let templateWX = await getXml(code, BUILD_TYPE);

        expect(prettifyXml(templateWX)).toMatch(
            prettifyXml(
                '<view class="aaa {{state.isOk && state.flag === \'checked\' ? \'checked\' : \'\'}}"></view>'
            ));
    });

    test('canvas id-tt', async() => {
        let code = 'return <canvas id="myCanvas"/>';
        let template = await getXml(code, BUILD_TYPE);

        expect(prettifyXml(template)).toMatch(
            prettifyXml('<canvas id="myCanvas" canvas-id="myCanvas" />')
        );
    });

});

describe('事件模版 -tt', () => {
    test('点击事件1 -tt', async () => {
        let code ='return <div onTap={this.tap.bind(this)}>hello world</div>;';

        let template = await getXml(code, BUILD_TYPE);
        expect(prettifyXml(template)).toMatch(
            prettifyXml('<view bindtap="dispatchEvent" data-tap-uid="e8_19" data-beacon-uid="default">hello world</view>')
        );
    });

    test('点击事件2 -tt', async () => {
        let code ='return <div catchTap={this.tap.bind(this)}>hello world</div>;';

        let template = await getXml(code, BUILD_TYPE);
        expect(prettifyXml(template)).toMatch(
            prettifyXml('<view catchtap="dispatchEvent" data-tap-uid="e8_19" data-beacon-uid="default">hello world</view>')
        );
    });

    test('input change 事件 -tt', async () => {
        let code = 'return <input type="idcard" onChange={this.change.bind(this)} />';

        let template = await getXml(code, BUILD_TYPE);
        expect(prettifyXml(template)).toMatch(
            prettifyXml('<input type="idcard" bindinput="dispatchEvent" data-input-uid="e8_35" data-beacon-uid="default" />')
        );

    });
});
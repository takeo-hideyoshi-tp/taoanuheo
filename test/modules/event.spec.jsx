import React from 'src/React'
import {SyntheticEvent, addEvent} from 'src/event'
import {DOMElement} from 'src/browser'

import {beforeHook, afterHook, browser} from 'karma-event-driver-ext/cjs/event-driver-hooks';
let {$serial} = browser;

describe('ReactDOM.render返回根组件的实例', function () {
    this.timeout(200000);
    before(async() => {
        await beforeHook();
    });
    after(async() => {
        await afterHook(false);
    });
    it('事件与样式', async() => {
        class A extends React.Component {
            constructor() {
                super()
                this.state = {
                    aaa: 111
                }
            }
            click(e) {
                this.setState({
                    aaa: this.state.aaa + 1
                })
            }

            render() {
                return (
                    <div
                        id="aaa3"
                        style={{
                        height: this.state.aaa
                    }}
                        onClick={this
                        .click
                        .bind(this)}>
                        {this.state.aaa}
                    </div>
                )
            }
        }

        var div = document.createElement('div');

        document
            .body
            .appendChild(div);
        var rootInstance = ReactDOM.render(
            <A/>, div);
        await browser
            .pause(100)
            .$apply()
        expect(rootInstance.state.aaa).toBe(111)
        await browser
            .click(rootInstance.vnode.dom)
            .pause(100)
            .$apply()

        expect(rootInstance.state.aaa).toBe(112)
        await browser
            .click(rootInstance.vnode.dom)
            .pause(100)
            .$apply()

        expect(rootInstance.state.aaa).toBe(113)
        document
            .body
            .removeChild(div)
    })

    it('冒泡', async() => {
        var aaa = ''
        class A extends React.PureComponent {
            constructor(props) {
                super(props)
                this.state = {
                    aaa: {
                        a: 7
                    }
                }
            }

            click() {
                aaa += 'aaa '

            }
            click2(e) {
                aaa += 'bbb '
                e.stopPropagation()
            }
            click3(e) {
                aaa += 'ccc '
            }
            render() {
                return <div onClick={this.click}>
                    <p>=========</p>
                    <div onClick={this.click2}>
                        <p>=====</p>
                        <div id="bubble" onClick={this.click3}>{this.state.aaa.a}</div>
                    </div>
                </div>
            }
        }

        var div = document.createElement('div');

        document
            .body
            .appendChild(div);
        var rootInstance = ReactDOM.render(
            <A/>, div);
        await browser
            .pause(100)
            .$apply()
        await browser
            .click('#bubble')
            .pause(100)
            .$apply()

        expect(aaa.trim()).toBe('ccc bbb')
        document
            .body
            .removeChild(div)

    })

    it('捕获', async() => {
        var aaa = ''
        class A extends React.PureComponent {
            constructor(props) {
                super(props)
                this.state = {
                    aaa: {
                        a: 7
                    }
                }
            }

            click() {
                aaa += 'aaa '

            }
            click2(e) {
                aaa += 'bbb '
                e.preventDefault()
                e.stopPropagation()
            }
            click3(e) {
                aaa += 'ccc '
            }
            render() {
                return <div onClickCapture={this.click}>
                    <p>=========</p>
                    <div onClickCapture={this.click2}>
                        <p>=====</p>
                        <div id="capture" onClickCapture={this.click3}>{this.state.aaa.a}</div>
                    </div>
                </div>
            }
        }

        var div = document.createElement('div');

        document
            .body
            .appendChild(div);
        var rootInstance = ReactDOM.render(
            <A/>, div);
        await browser
            .pause(100)
            .$apply()
        await browser
            .click('#capture')
            .pause(100)
            .$apply()

        expect(aaa.trim()).toBe('aaa bbb')
        document
            .body
            .removeChild(div)

    })
    it('event', function () {
        var obj = {
            type: 'change',
            srcElement: 1
        }
        var e = new SyntheticEvent(obj)
        expect(e.type).toBe('change')
        expect(e.timeStamp).toA('number')
        expect(e.target).toBe(1)
        expect(e.originalEvent).toBe(obj)
        e.stopImmediatePropagation()
        expect(e._stopPropagation).toBe(true)
        expect(e.toString()).toBe('[object Event]')
        var e2 = new SyntheticEvent(e)
        expect(e2).toBe(e)

        var p = new DOMElement
        p.addEventListener = false
        addEvent(p, 'type', 'xxx')
    })

})
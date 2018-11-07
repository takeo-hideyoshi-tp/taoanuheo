import React from '@react';
import './index.scss';
/* eslint-disable */
// 事件
class Data extends React.Component {
    constructor() {
        super();
        this.state = {
            data: '1234455',
            copy: ''
        };
    }

    setStorage() {
        React.api.setStorage({
            key: 'v1',
            data: { key: 12 },
            success: function(data) {
                console.log('handling success');
            },
            fail: function(data, code) {
                console.log(`handling fail, code = ${code}`);
            }
        });
    }

    getStorage() {
        React.api.getStorage({
            key: 'v1',
            success: function(res) {
                console.log('handling success', res.data);
            },
            fail: function(data, code) {
                console.log(`handling fail, code = ${code}`);
            }
        });
    }

    removeStorage() {
        React.api.removeStorage({
            key: 'v1',
            success: function(data) {
                console.log('handling success');
            },
            fail: function(data, code) {
                console.log(`handling fail, code = ${code}`);
            }
        });
    }
  
    render() {
        return (
            <div class="col">
                <div onClick={this.setStorage} class="item">
                    <text>setStorage</text>
                </div>
                <div onClick={this.getStorage} class="item">
                    <text>getStorage</text>
                </div>
                <div onClick={this.removeStorage} class="item">
                    <text>removeStorage</text>
                </div>
            </div>
        );
    }
}
export default Data;
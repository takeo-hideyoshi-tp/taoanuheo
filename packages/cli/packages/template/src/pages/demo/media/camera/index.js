import React from '@react';

class Camera extends React.Component {
    constructor() {
        super();
        this.state = {
            mode: 'normal',
            devicePosition: 'back',
            flash: 'auto',
            src: ''
        };
    }

    takePhoto() {
        const ctx = wx.createCameraContext();

        ctx.takePhoto({
            quality: 'high',
            success: res => {
                this.setState({
                    src: res.tempImagePath
                });
            },
            error: function(err) {
                console.log(err);
            }
        });
    }

    render() {
        return (
            <div style="display:flex;flex-direction:column;align-items:center;padding-top:25rpx;">
                <div>
                    <camera mode={this.state.mode} />
                </div>
                <div style="font-size: 32rpx;">
                    <button onTap={this.takePhoto} />
                    <span style="color: #999;">预览</span>
                    <image src={this.state.src} />
                </div>
            </div>
        );
    }
}


export default Camera;

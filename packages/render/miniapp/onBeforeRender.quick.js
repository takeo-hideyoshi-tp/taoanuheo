import { delayMounts, _getApp } from './utils';
export function onBeforeRender(fiber) {
    let type = fiber.type;
    let instance = fiber.stateNode;
    //let noMount = !fiber.hasMounted;
    if (type.reactInstances) {
        let uuid = fiber.props['data-instance-uid'] || null;
        if (!instance.instanceUid) {
            instance.instanceUid = uuid;
        }
        if (fiber.props.isPageComponent) {
            let wx = _getApp().$$page; 
            instance.wx = wx;
            wx.reactInstance = instance;
        }
        //只处理component目录下的组件
        let wxInstances = type.wxInstances;
        if (wxInstances && !instance.wx) { //必须过滤已绑定的组件
            type.reactInstances.push(instance);
        }
    }
    if (!_getApp().$$pageIsReady && instance.componentDidMount) {
        delayMounts.push({
            instance: instance,
            fn: instance.componentDidMount
        });
        instance.componentDidMount = Date;
    }
}

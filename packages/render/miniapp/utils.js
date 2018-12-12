import { hasOwnProperty, noop } from 'react-core/util';
import { createElement } from 'react-core/createElement';


export var shareObject = {
    app: {}
};
function _getApp() {
    if (typeof getApp === 'function') {    
        return getApp();//esline-disabled-line;
    }
    return shareObject.app;
}
if (typeof getApp === 'function') {    
    //这时全局可能没有getApp
    _getApp = getApp;//esline-disabled-line;
}
export { _getApp };
export function callGlobalHook(method, e) {
    var app = _getApp();
    if (app && app[method]) {
        return app[method](e);
    }
}

export var delayMounts = [];
export var usingComponents = [];
export var registeredComponents = {};
export var pageState = {
    isReady: false
};
export function getCurrentPage() {
    console.log(_getApp(), 'getApp');
    console.log('getCurrentPage中的pageState.wx', pageState.wx);
    return pageState.wx && pageState.wx.reactInstance;
}
export function _getCurrentPages() {
    console.warn("getCurrentPages存在严重的平台差异性，不建议再使用"); //eslint-disable-line
    if (typeof getCurrentPages === 'function') {
        return getCurrentPages(); //eslint-disable-line
    }
}

//用于保存所有用miniCreateClass创建的类，然后在事件系统中用到
export var classCached = {};


export function updateMiniApp(instance) {
    if (!instance || !instance.wx) {
        return;
    }
    var data = safeClone({
        props: instance.props,
        state: instance.state || null,
        context: instance.context
    });
    if (instance.wx.setData) {
        instance.wx.setData(data);
    } else {
        updateQuickApp(instance.wx, data);
    }
}

function updateQuickApp(quick, data) {
    for (var i in data) {
        quick.$set(i, data[i]);
    }
}

function isReferenceType(val) {
    return (
        val &&
        (typeof val === 'object' ||
            Object.prototype.toString.call(val) === '[object Array]')
    );
}

export function runFunction(fn, a, b) {
    if (typeof fn == 'function') {
        fn.call(null, a, b);
    }
}

// 计算参数中有多少个函数
function functionCount(...fns) {
    return fns
        .map(fn => typeof fn === 'function')
        .reduce((count, fn) => count + fn, 0);
}

export function apiRunner(arg = {}, apiCallback, apiPromise) {
    const { success, fail, complete } = arg;
    // 如果提供了回调函数则使用回调函数形式调用 API
    // 否则返回一个 Promise
    const handler = functionCount(success, fail, complete)
        ? apiCallback
        : apiPromise;
    arg.success = arg.success || noop;
    arg.fail = arg.fail || noop;
    arg.complete = arg.complete || noop;
    return handler(arg);
}

export function useComponent(props) {
    var is = props.is;
    var clazz = registeredComponents[is];
    //确保两个相邻的业务组件的数据不会串了
    props.key = props.key || props['data-instance-uid'] || new Date - 0;
    delete props.is;
    var args = [].slice.call(arguments, 2);
    args.unshift(clazz, props);
    return createElement.apply(null, args);
}

function safeClone(originVal) {
    let temp = originVal instanceof Array ? [] : {};
    for (let item in originVal) {
        if (hasOwnProperty.call(originVal, item)) {
            let value = originVal[item];
            if (isReferenceType(value)) {
                if (value.$$typeof) {
                    continue;
                }
                temp[item] = safeClone(value);
            } else {
                temp[item] = value;
            }
        }
    }
    return temp;
}

export function toRenderProps() {
    return null;
}

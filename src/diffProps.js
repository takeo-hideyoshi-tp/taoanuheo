import {patchStyle} from './style'

import {addGlobalEventListener, getBrowserName, isEventName} from './event'
import {oneObject, toLowerCase, noop} from './util'

import {document} from './browser'

var eventNameCache = {
    'onClick': 'click',
    'onChange': 'change'
}

function clickHack() {}
let inMobile = 'ontouchstart' in document
var xlink = "http://www.w3.org/1999/xlink"
var stringAttributes = {}
export var builtIdProperties = {} //不规则的属性名映射

//防止压缩时出错

/*
  contenteditable不是布尔属性
  http://www.zhangxinxu.com/wordpress/2016/01/contenteditable-plaintext-only/
  contenteditable=''
  contenteditable='events'
  contenteditable='caret'
  contenteditable='plaintext-only'
  contenteditable='true'
  contenteditable='false'
   */
var bools = ['autofocus,autoplay,async,allowTransparency,checked,controls', 'declare,disabled,defer,defaultChecked,defaultSelected,', 'isMap,loop,multiple,noHref,noResize,noShade', 'open,readOnly,selected'].join(',')
var boolAttributes = {}
bools.replace(/\w+/g, function (name) {
    boolAttributes[name] = true
})

var anomaly = ['accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan', 'dateTime,defaultValue,contentEditable,frameBorder,maxLength,marginWidth', 'marginHeight,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign'].join(',')

anomaly.replace(/\w+/g, function (name) {
    builtIdProperties[name] = name
})
String('value,id,title,alt,htmlFor,name,type,longDesc,className').replace(/\w+/g, function (name) {
    builtIdProperties[name] = name
})

/**
 *
 * 修改dom的属性与事件
 * @export
 * @param {any} nextProps
 * @param {any} lastProps
 * @param {any} vnode
 * @param {any} lastVnode
 */
export function diffProps(nextProps, lastProps, vnode, lastVnode, dom) {
    /* istanbul ignore if */
    if (nextProps === lastProps) {
        return
    }
    if (vnode.ns === 'http://www.w3.org/2000/svg') {
        return diffSVGProps(nextProps, lastProps, vnode, lastVnode, dom)
    }
    for (let name in nextProps) {
        let val = nextProps[name]
        if (val !== lastProps[name]) {
            var hookName = getHookType(name, val, vnode.type, dom)
            propHooks[hookName](dom, name, val, lastProps)
        }
    }
    //如果旧属性在新属性对象不存在，那么移除DOM

    for (let name in lastProps) {
        if (!(name in nextProps)) {
            if (isEventName(name)) { //移除事件
                let events = dom.__events || {}
                delete events[name]
            } else { //移除属性
                if (builtIdProperties[name]) {
                    dom[name] = builtIdProperties[name] === true
                        ? false
                        : ''
                } else {
                    dom.removeAttribute(name)
                }
            }
        }

    }
}
var controlled = {
    value: 1,
    defaultValue: 1
}
var booleanTag = {
    script: 1,
    iframe: 1,
    a: 1,
    map: 1,

    vedio: 1,
    bgsound: 1,

    form: 1,
    select: 1,
    inout: 1,
    textarea: 1,
    option: 1,
    keygen: 1
}
var specialProps = {
    children: 1,
    style: 1,
    className: 1,
    dangerouslySetInnerHTML: 1
}

function getHookType(name, val, type, dom) {
    if (specialProps[name]) 
        return name
    if (boolAttributes[name] && booleanTag[type]) {
        return 'boolean'
    }
    if (isEventName(name)) {
        return '__event__'
    }
    if (!val && val !== '' && val !== 0) {
        return 'removeAttribute'
    }
    return (!builtIdProperties[name] && (name.indexOf('data-') === 0 || typeof dom[name] === 'undefined'))
        ? 'setAttribute'
        : 'property'
}

//children style HTML_KEY, 事件
function diffSVGProps(nextProps, lastProps, vnode, lastVnode, dom) {
    // http://www.w3school.com.cn/xlink/xlink_reference.asp
    // https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#notable-enh
    // a ncements xlinkActuate, xlinkArcrole, xlinkHref, xlinkRole, xlinkShow,
    // xlinkTitle, xlinkType
    for (let name in nextProps) {
        if (isEventName(name)) {
            propHooks.__event__(dom, name, val, lastProps)
            continue
        }
        if (name === 'style') {
            patchStyle(dom, lastProps.style || {}, val)
            continue
        }
        let val = nextProps[name]
        var method = val === false || val === null || val === undefined
            ? 'removeAttribute'
            : 'setAttribute'
        if (svgprops[name]) {
            dom[method + 'NS']('http://www.w3.org/1999/xlink', svgprops[name], val + '')
            continue
        } else if (name === 'className') {
            name = 'class'
        } else {
            name = toLowerCase(name)
        }
        dom[method](name, val + '')
    }
    for (let name in lastProps) {
        if (!nextProps.hasOwnProperty(name)) {
            if (svgprops[name]) {
                dom.removeAttributeNS('http://www.w3.org/1999/xlink', name)
                continue
            } else if (name === 'className') {
                name = 'class'
            } else {
                name = toLowerCase(name)
            }
            dom.removeAttribute(name)
        }
    }
}

var svgprops = {
    xlinkActuate: 'xlink:actuate',
    xlinkArcrole: 'xlink:arcrole',
    xlinkHref: 'xlink:href',
    xlinkRole: 'xlinkRole',
    xlinkShow: 'xlink:show'
}

var propHooks = {
    boolean: function (dom, name, val, lastProp) {
        // 布尔属性必须使用el.xxx = true|false方式设值 如果为false, IE全系列下相当于setAttribute(xxx,''),
        // 会影响到样式,需要进一步处理 eslint-disable-next-line
        dom[name] = !!val
        if (!val) {
            dom.removeAttribute(name)
        }
    },
    removeAttribute: function (dom, name) {
        dom.removeAttribute(name)
    },
    setAttribute: function (dom, name, val) {
        try {
            dom.setAttribute(name, val)
        } catch (e) {
            console.log('setAttribute error', name, val)
        }

    },
    property: function (dom, name, val) {
        if (name !== 'value' || dom[name] !== val) {
            dom[name] = val
            if (controlled[name]) {
                dom._lastValue = val
            }
        }
    },
    children: noop,
    className: function (dom, _, val, lastProps) {
        dom.className = val
    },
    style: function (dom, _, val, lastProps) {
        patchStyle(dom, lastProps.style || {}, val)
    },
    __event__: function (dom, name, val, lastProps) {
        if (!lastProps[name]) { //添加全局监听事件
            var eventName = getBrowserName(name) //带on
            var curType = typeof val
            /* istanbul ignore if */
            if (curType !== 'function') 
                throw 'Expected ' + name + ' listener to be a function, instead got type ' + curType
            addGlobalEventListener(eventName)
        }
        /* istanbul ignore if */
        if (inMobile && eventName === 'click') {
            dom.addEventListener('click', clickHack)
        }
        let events = (dom.__events || (dom.__events = {}))
        events[name] = val
    },

    dangerouslySetInnerHTML: function (dom, name, val, lastProps) {
        var oldhtml = lastProps[name] && lastProps[name].__html
        if (val && val.__html !== oldhtml) {
            dom.innerHTML = val.__html
        }
    }
}

import { patchStyle } from "./style";
import { addGlobalEvent, getBrowserName, isEventName, eventHooks } from "./event";
import { oneObject, toLowerCase, noop, typeNumber } from "./util";


// XML 的命名空间对应的 URI
var NAMESPACE_MAP = {
    svg: "http://www.w3.org/2000/svg",
    xmlns: "http://www.w3.org/2000/xmlns/",
    xml: "http://www.w3.org/XML/1998/namespace",
    xlink: "http://www.w3.org/1999/xlink",
    xhtml: "http://www.w3.org/1999/xhtml"
};

//布尔属性的值末必为true,false
//https://github.com/facebook/react/issues/10589
var controlled = {
    value: 1,
    defaultValue: 1
};

var isSpecialAttr = {
    children: 1,
    style: 1,
    innerHTML: 1,
    dangerouslySetInnerHTML: 1
};

var emptyStyle = {};
var svgCache = {}
/**
 * 仅匹配 svg 属性名中的第一个驼峰处，如 viewBox 中的 wB，
 * 数字表示该特征在属性列表中重复的次数
 * -1 表示用 ':' 隔开的属性 (xlink:href, xlink:title 等)
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute
 */
var svgCamelCase = {
    w: { r: 1, b: 1, t: 1 },
    e: { n: 1, t: 1, f: 1, p: 1, c: 1, m: 1, a: 2, u: 1, s: 1, v: 1 },
    o: { r: 1 },
    c: { m: 1 },
    p: { p: 1 },
    t: { s: 2, t: 1, u: 1, c: 1, d: 1, o: 1, x: 1, y: 1, l: 1 },
    l: { r: 1, m: 1, u: 1, b: -1, l: -1, s: -1 },
    r: { r: 1, u: 2, h: 1, w: 1, c: 1, e: 1 },
    h: { r: 1, a: 1, l: 1, t: 1 },
    y: { p: 1, s: 1, t: 1, c: 1 },
    g: { c: 1 },
    k: { a: -1, h: -1, r: -1, s: -1, t: -1, c: 1, u: 1 },
    m: { o: 1, l: 1, a: 1 },
    n: { c: 1, t: 1, u: 1 },
    s: { a: 3 },
    f: { x: 1, y: 1 },
    d: { e: 1, f: 1, m: 1, d: 1 },
    x: { c: 1 }
};

// SVG 属性列表中驼峰命名和短横线分隔命名特征值有重复
// 列出了重复特征中的短横线命名的属性名
var specialSVGPropertyName = {
    "overline-thickness": 2,
    "underline-thickness": 2,
    "overline-position": 2,
    "underline-position": 2,
    "stroke-miterlimit": 2,
    "baseline-shift": 2,
    "clip-path": 2,
    "font-size": 2,
    "font-size-adjust": 2,
    "font-stretch": 2,
    "font-style": 2,
    "text-decoration": 2,
    "vert-origin-x": 2,
    "vert-origin-y": 2,
    "paint-order": 2,
    "fill-rule": 2,
    "color-rendering": 2,
    "marker-end": 2,
    "pointer-events": 2,
    "units-per-em": 2,
    "strikethrough-thickness": 2,
    "lighting-color": 2
};

// 重复属性名的特征值列表
var repeatedKey = [
    "et",
    "ep",
    "em",
    "es",
    "pp",
    "ts",
    "td",
    "to",
    "lr",
    "rr",
    "re",
    "ht",
    "gc"
];

function genReplaceValue(split) {
    return function (match) {
        return match.slice(0, 1) + split + match.slice(1).toLowerCase();
    };
}

function getSVGAttributeName(name) {
    if (svgCache[name]) {
        return svgCache[name]
    }
    const key = name.match(/[a-z][A-Z]/);
    if (!key) {
        return svgCache[name] = name
    }
    const [prefix, postfix] = [...key[0].toLowerCase()];
    let orig = name
    if (svgCamelCase[prefix] && svgCamelCase[prefix][postfix]) {
        const count = svgCamelCase[prefix][postfix];

        if (count === -1) {
            return svgCache[orig] = {
                name: name.replace(/[a-z][A-Z]/, genReplaceValue(":")),
                ifSpecial: true
            };
        }

        if (~repeatedKey.indexOf(prefix + postfix)) {
            const dashName = name.replace(/[a-z][A-Z]/, genReplaceValue("-"));
            if (specialSVGPropertyName[dashName]) {
                name = dashName;
            }
        }
    } else {
        name = name.replace(/[a-z][A-Z]/, genReplaceValue("-"));
    }

    return svgCache[orig] = name
}


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
    var isSVG = vnode.ns === "http://www.w3.org/2000/svg"
    //eslint-disable-next-line
    for (let name in nextProps) {
        let val = nextProps[name];
        if (val !== lastProps[name]) {
            let hookName = getHookType(name, val, vnode.type, dom, isSVG);
            propAdapters[hookName](dom, name, val, lastProps);
        }
    }
    //如果旧属性在新属性对象不存在，那么移除DOM eslint-disable-next-line
    for (let name in lastProps) {
        if (!nextProps.hasOwnProperty(name)) {
            let hookName = getHookType(name, false, vnode.type, dom, isSVG);
            propAdapters[hookName](dom, name, false, lastProps);
        }
    }
}
var booleanAttr = {};
function isBooleanAttr(dom, name, val) {
    if (val === false || val === true) {
        if (booleanAttr[name]) {
            return true;
        }
        if (typeNumber(dom[name])) {
            return booleanAttr[name] = true;
        }
    }
}
/**
 * 取得属性的处理令牌，方便分配到各自的适配器进行加工
 * 
 * @param {any} name 属性名
 * @param {any} val 属性值
 * @param {any} type 标签名
 * @param {any} dom 元素节点
 * @param {any} isSVG 
 * @returns 
 */
function getHookType(name, val, type, dom, isSVG) {
    if (isSVG && name === 'className') {
        return 'svgClass'
    }
    if (isSpecialAttr[name]) {
        return name;
    }
    if (isEventName(name)) {
        return "event";
    }
    if (isSVG) {
        return "svgAttr";
    }   
     if (isBooleanAttr(dom, name, val)) {
        return "booleanAttr";
    }
    if (typeNumber(val) < 3 && !val) {
        return "removeAttribute";
    }
    return name.indexOf("data-") === 0 || dom[name] === void 666
        ? "setAttribute"
        : "property";
}

export var propAdapters = {
    innerHTML: noop,
    children: noop,
    style: function (dom, _, val, lastProps) {
        patchStyle(dom, lastProps.style || emptyStyle, val || emptyStyle);
    },
    svgClass: function (dom, name, val) {
        if (!val) {
            dom.removeAttribute("class");
        } else {
            dom.setAttribute("class", val);
        }
    },
    svgAttr: function (dom, name, val) {
        // http://www.w3school.com.cn/xlink/xlink_reference.asp
        // https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#notable-enh
        // a ncements xlinkActuate, xlinkArcrole, xlinkHref, xlinkRole, xlinkShow,
        // xlinkTitle, xlinkType eslint-disable-next-line
        var method = typeNumber(val) < 3 && !val ? "removeAttribute" : "setAttribute";
        var nameRes = getSVGAttributeName(name);
        if (nameRes.ifSpecial) {
            var prefix = nameRes.name.split(":")[0];
            // 将xlinkHref 转换为 xlink:href
            dom[method + "NS"](NAMESPACE_MAP[prefix], nameRes.name, val || "");
            return;
        } else {
            dom[method](nameRes, val || "");
        }
    },
    booleanAttr: function (dom, name, val) {
        // 布尔属性必须使用el.xxx = true|false方式设值 如果为false, IE全系列下相当于setAttribute(xxx,''),
        // 会影响到样式,需要进一步处理 eslint-disable-next-line
        var bool = !!val
        dom[name] = bool
        if (dom[name] === false) {
            dom.removeAttribute(name);
        }else if(dom[name] === 'false'){ //字符串属性会将它转换为false
            dom[name] = ''
        }
    },
    removeAttribute: function (dom, name) {
        dom.removeAttribute(name);
    },
    setAttribute: function (dom, name, val) {
        try {
            dom.setAttribute(name, val);
        } catch (e) {
            console.log("setAttribute error", name, val); // eslint-disable-line
        }
    },
    property: function (dom, name, val) {
        if (name !== "value" || dom[name] !== val) {
            // 尝试直接赋值，部分情况下会失败，如给 input 元素的 size 属性赋值 0 或字符串
            // 这时如果用 setAttribute 则会静默失败
            try {
                dom[name] = val;
            } catch (e) {
                dom.setAttribute(name, val);
            }
            if (controlled[name]) {
                dom._lastValue = val;
            }
        }
    },
    event: function (dom, name, val, lastProps) {
        let events = dom.__events || (dom.__events = {});
        if (val === false) {
            delete events[toLowerCase(name.slice(2))];
        } else {
            if (!lastProps[name]) {
                //添加全局监听事件
                var _name = getBrowserName(name);
                addGlobalEvent(_name);
                var hook = eventHooks[_name];
                if (hook) {
                    hook(dom, _name);
                }
            }
            //onClick --> click, onClickCapture --> clickcapture
            events[toLowerCase(name.slice(2))] = val;
        }
    },
    dangerouslySetInnerHTML: function (dom, name, val, lastProps) {
        var oldhtml = lastProps[name] && lastProps[name].__html;
        var html = val && val.__html;
        if (html !== oldhtml) {
            dom.innerHTML = html;
        }
    }
};

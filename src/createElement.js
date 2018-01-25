import { typeNumber, hasSymbol, REACT_FRAGMENT_TYPE } from "./util";
import { Vnode } from "./vnode";

function Fragment(props) {
    return props.children;
}
/**
 * 虚拟DOM工厂
 *
 * @param {string|function|Component} type
 * @param {object} props
 * @param {array} ...children
 * @returns
 */

export function createElement(type, config, ...children) {
    let props = {},
        vtype = 1,
        key = null,
        ref = null,
        argsLen = children.length;
    if (type && type.call) {
        vtype = type.prototype && type.prototype.render ? 2 : 4;
    } else if (type === REACT_FRAGMENT_TYPE) {
        (type = Fragment), (vtype = 4);
    } else if (type + "" !== type) {
        throw "React.createElement第一个参数只能是函数或字符串";
    }
    if (config != null) {
        for (let i in config) {
            let val = config[i];
            if (i === "key") {
                if (val !== void 0) {
                    key = val + "";
                }
            } else if (i === "ref") {
                if (val !== void 0) {
                    ref = val;
                }
            } else {
                props[i] = val;
            }
        }
    }

    if (argsLen === 1) {
        props.children = children[0];
    } else if (argsLen > 1) {
        props.children = children;
    }

    let defaultProps = type.defaultProps;
    if (defaultProps) {
        for (let propName in defaultProps) {
            if (props[propName] === void 666) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    return new Vnode(type, vtype, props, key, ref);
}

export function createVText(type, text) {
    var vnode = new Vnode(type, 0);
    vnode.text = text;
    return vnode;
}

// 用于辅助XML元素的生成（svg, math),
// 它们需要根据父节点的tagName与namespaceURI,知道自己是存在什么文档中
export function createVnode(node) {
    var type = node.nodeName,
        vnode;
    if (node.nodeType === 1) {
        vnode = new Vnode(type, 1);
        var ns = node.namespaceURI;
        if (!ns || ns.indexOf("html") >= 22) {
            vnode.type = type.toLowerCase(); //HTML的虚拟DOM的type需要小写化
        } else {
            //非HTML需要加上命名空间
            vnode.namespaceURI = ns;
        }
        vnode.props = getProps(node);
    } else {
        vnode = createVText(type, node.nodeValue);
    }
    vnode.stateNode = node;
    return vnode;
}

function getProps(node) {
    var attrs = node.attributes,
        props = {};
    for (var i = 0, attr; (attr = attrs[i++]); ) {
        if (attr.specified) {
            var name = attr.name;
            if (name === "class") {
                name = "className";
            }
            props[name] = attr.value;
        }
    }
    return props;
}

var lastText, flattenIndex, flattenObject, flattenPrev, flattenArray;
function flattenCb(child, index, vnode) {
    let childType = typeNumber(child);
    if (childType < 3) {
        //在React16中undefined, null, boolean不会产生节点
        lastText = null;
        return;
    } else if (childType < 5) {
        //number string
        if (lastText) {
            //合并相邻的文本节点
            lastText.text += child;
            return;
        }
        lastText = child = createVText("#text", child + "");
    } else {
        lastText = null;
    }
    var key = child.key;
    if (key && !flattenObject[".$" + key]) {
        flattenObject[".$" + key] = child;
    } else {
        if (index === ".") {
            index = "." + flattenIndex;
        }
        flattenObject[index] = child;
    }
    child.index = flattenIndex;
    child.return = vnode;
    if (flattenPrev) {
        flattenPrev.sibling = child;
    }
    flattenPrev = child;
    flattenIndex++;
    flattenArray.push(child);
}

export function fiberizeChildren(c, updater) {
    flattenObject = {};
    flattenPrev = null;
    flattenArray = [];
    let vnode = updater.vnode;
    if (c !== void 666) {
        lastText = null;
        flattenIndex = 0;
        operateChildren(c, "", flattenCb, vnode);
        let child = flattenArray[0];
        if (child) {
            vnode.child = child;
        }
        if (flattenPrev) {
            delete flattenPrev.sibling;
        }
    }
    return (updater.children = flattenObject);
}

export function operateChildren(children, prefix, callback, parent) {
    var iteratorFn;
    if (children) {
        if (children.forEach) {
            children.forEach(function(el, i) {
                operateChildren(el, prefix ? prefix + ":" + i : "." + i, callback, parent);
            });
            return;
        } else if ((iteratorFn = getIteractor(children))) {
            var iterator = iteratorFn.call(children),
                ii = 0,
                step;
            while (!(step = iterator.next()).done) {
                operateChildren(step.value, prefix ? prefix + ":" + ii : "." + ii, callback, parent);
                ii++;
            }
            return;
        }
    }
    if (Object(children) === children && !children.call && !children.type) {
        throw "children中存在非法的对象";
    }
    callback(children, prefix || ".", parent);
}
var REAL_SYMBOL = hasSymbol && Symbol.iterator;
var FAKE_SYMBOL = "@@iterator";
function getIteractor(a) {
    if (typeNumber(a) > 7) {
        var iteratorFn = (REAL_SYMBOL && a[REAL_SYMBOL]) || a[FAKE_SYMBOL];
        if (iteratorFn && iteratorFn.call) {
            return iteratorFn;
        }
    }
}


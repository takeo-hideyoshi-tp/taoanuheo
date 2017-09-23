import { EMPTY_CHILDREN, typeNumber, isFn } from "./util";

export var CurrentOwner = {
    cur: null
};
/**
 * 创建虚拟DOM
 *
 * @param {string} type
 * @param {object} props
 * @param {array} ...children
 * @returns
 */

export function createElement(type, config, ...children) {
    let props = {},
        checkProps = 0,
        vtype = 1,
        key = null,
        ref = null,
        argsLen = children.length;
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
            } else if (i === "children") {
                props[i] = val;
            } else {
                checkProps = 1;
                props[i] = val;
            }
        }
    }

    if (argsLen === 1) {
        props.children = typeNumber(children[0]) > 2 ? children[0] : EMPTY_CHILDREN;
    } else if (argsLen > 1) {
        props.children = children;
    }

    let defaultProps = type.defaultProps;
    if (defaultProps) {
        for (let propName in defaultProps) {
            if (props[propName] === void 666) {
                checkProps = 1;
                props[propName] = defaultProps[propName];
            }
        }
    }
    if (isFn(type)) {
        vtype = type.prototype && type.prototype.render ? 2 : 4;
    }
    return new Vnode(type, key, ref, props, vtype, checkProps);
}

//fix 0.14对此方法的改动，之前refs里面保存的是虚拟DOM
function getDOMNode() {
    return this;
}

function createStringRef(owner, ref) {
    function stringRef(dom) {
        if (dom) {
            if (dom.nodeType) {
                dom.getDOMNode = getDOMNode;
            }
            owner.refs[ref] = dom;
        }
    }
    stringRef.string = ref;
    return stringRef;
}
function Vnode(type, key, ref, props, vtype, checkProps) {
    this.type = type;
    this.props = props;
    this.vtype = vtype;
    var owner = CurrentOwner.cur;
    this._owner = owner;

    if (key) {
        this.key = key;
    }

    if (vtype === 1) {
        this.checkProps = checkProps;
    }
    let refType = typeNumber(ref);
    if (refType === 4) {
    //string
        this.ref = createStringRef(owner, ref);
    } else if (refType === 5) {
        if (ref.string) {
            var ref2 = createStringRef(owner, ref.string);
            this.ref = function(dom) {
                ref(dom);
                ref2(dom);
            };
        } else {
            //function
            this.ref = ref;
        }
    }
    /*
      this._hostNode = null
      this._instance = null
    */
}

Vnode.prototype = {
    getDOMNode: function() {
        return this._hostNode || null;
    },

    $$typeof: 1
};

export function flattenChildren(vnode) {
    let arr = EMPTY_CHILDREN,
        c = vnode.props.children;
    if (c !== null) {
        arr = _flattenChildren(c, true);
        if (arr.length === 0) {
            arr = EMPTY_CHILDREN;
        }
    }
    return (vnode.vchildren = arr);
}

export function _flattenChildren(original, convert) {
    let children = [],
        unidimensionalIndex = 0,
        lastText,
        child,
        isMap = convert === "",
        isEnumerable,
        temp = Array.isArray(original) ? original.slice(0) : [original];

    while (temp.length) {
        if (
            (child = temp.shift()) &&
      (child.shift || (isEnumerable = hasIteractor(child)))
        ) {
            //比较巧妙地判定是否为子数组

            if (isEnumerable) {
                //兼容Immutable.js, Map, Set
                child = fixIteractor(child);
                isEnumerable = false;
                temp.unshift.apply(temp, child);
                continue;
            }
            if (isMap) {
                if (!child._prefix) {
                    child._prefix = "." + unidimensionalIndex;
                    unidimensionalIndex++; //维护第一层元素的索引值
                }
                for (let i = 0; i < child.length; i++) {
                    if (child[i]) {
                        child[i]._prefix = child._prefix + ":" + i;
                    }
                }
            }
            temp.unshift.apply(temp, child);
        } else {
            let childType = typeNumber(child);
            if (childType < 3) {
                // 0, 1, 2
                if (convert) {
                    continue;
                } else {
                    child = null;
                }
            } else if (childType < 6) {
                if (lastText && convert) {
                    //false模式下不进行合并与转换
                    lastText.text += child;
                    continue;
                }
                if (convert) {
                    child = {
                        type: "#text",
                        text: child + "",
                        vtype: 0
                    };
                    unidimensionalIndex++;
                }
                lastText = child;
            } else {
                if (isMap && !child._prefix) {
                    child._prefix = "." + unidimensionalIndex;
                    unidimensionalIndex++;
                }
                lastText = false;
            }

            children.push(child);
        }
    }
    return children;
}
function hasIteractor(a) {
    //不能为数字
    return a && a["@@iterator"] && isFn(a["@@iterator"]) && a + 0 !== a;
}
function fixIteractor(a) {
    let iterator = a["@@iterator"].call(a),
        step,
        ret = [];
    while (!(step = iterator.next()).done) {
        ret.push(step.value);
    }
    return ret;
}

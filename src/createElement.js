import { __push, typeNumber } from "./util";


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

export function createElement(type, configs) {
    var props = {},
        key = null,
        ref = null,
        vtype = 1,
        checkProps = 0;
    var stack = []
    for (let i = 2, n = arguments.length; i < n; i++) {
        stack.push(arguments[i]);
    }

    if (configs) {

        // eslint-disable-next-line
        for (let i in configs) {
            var val = configs[i];
            switch (i) {
                case "key":
                    key = val + "";
                    break;
                case "ref":
                    ref = val;
                    break;
                case "children":
                    // 只要不是通过JSX产生的createElement调用，props内部就千奇百度， children可能是一个数组，也可能是一个字符串，数字，布尔，
                    // 也可能是一个虚拟DOM

                    if (!stack.length && val) {
                        if (Array.isArray(val)) {
                            __push.apply(stack, val);
                        } else {
                            stack.push(val);
                        }
                    }
                    break;
                default:
                    checkProps = 1;
                    props[i] = val;
            }
        }

    }
    let defaultProps = type.defaultProps
    if (defaultProps) {
        for (let propKey in defaultProps) {
            if (props[propKey] === void 0) {
                props[propKey] = defaultProps[propKey]
            }
        }
    }

    if (typeNumber(type) === 5) {
        //fn
        vtype = type.prototype && type.prototype.render
            ? 2
            : 4;
    }
    props.children = stack.length === 1 ? stack[0] : stack;


    return new Vnode(type, key, ref, props, vtype, checkProps);
}


//fix 0.14对此方法的改动，之前refs里面保存的是虚拟DOM
function getDOMNode() {
    return this;
}
export function __ref(dom) {
    var instance = this._owner;
    if (dom && instance) {
        dom.getDOMNode = getDOMNode;
        instance.refs[this.__refKey] = dom;
    }
}
function Vnode(type, key, ref, props, vtype, checkProps) {
    this.type = type;
    this.props = props;
    this.vtype = vtype;
    this._owner = CurrentOwner.cur
    if (key) {
        this.key = key;
    }

    if (vtype === 1) {
        this.checkProps = checkProps;
    }
    var refType = typeNumber(ref);
    if (refType === 4) {
        //string
        this.__refKey = ref;
        this.ref = __ref;
    } else if (refType === 5) {
        //function
        this.ref = ref;
    }
    /*
      this._hostNode = null
      this._instance = null
    */
}

Vnode.prototype = {
    getDOMNode: function () {
        return this._hostNode || null;
    },

    $$typeof: 1
};

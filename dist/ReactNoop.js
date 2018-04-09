/**
 * 此个版本专门用于测试
 * by 司徒正美 Copyright 2018-04-09
 * IE9+
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ReactNoop = factory());
}(this, (function () {

var __push = Array.prototype.push;
var hasSymbol = typeof Symbol === "function" && Symbol["for"];

var hasOwnProperty = Object.prototype.hasOwnProperty;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol["for"]("react.element") : 0xeac7;
function Fragment(props) {
    return props.children;
}
function get(key) {
    return key._reactInternalFiber;
}



var emptyObject = {};
var fakeWindow = {};
function getWindow() {
    try {
        return window;
    } catch (e) {
        try {
            return global;
        } catch (e) {
            return fakeWindow;
        }
    }
}
function toWarnDev(msg, deprecated) {
    msg = deprecated ? msg + " is deprecated" : msg;
    var process = getWindow().process;
    if (process && process.env.NODE_ENV === "development") {
        throw msg;
    }
}
function extend(obj, props) {
    for (var i in props) {
        if (hasOwnProperty.call(props, i)) {
            obj[i] = props[i];
        }
    }
    return obj;
}
function returnFalse() {
    return false;
}
function returnTrue() {
    return true;
}
var __type = Object.prototype.toString;
function noop() {}
function inherit(SubClass, SupClass) {
    function Bridge() {}
    var orig = SubClass.prototype;
    Bridge.prototype = SupClass.prototype;
    var fn = SubClass.prototype = new Bridge();
    extend(fn, orig);
    fn.constructor = SubClass;
    return fn;
}


function isFn(obj) {
    return __type.call(obj) === "[object Function]";
}
var rword = /[^, ]+/g;
function oneObject(array, val) {
    if (array + "" === array) {
        array = array.match(rword) || [];
    }
    var result = {},
    value = val !== void 666 ? val : 1;
    for (var i = 0, n = array.length; i < n; i++) {
        result[array[i]] = value;
    }
    return result;
}


var options = oneObject(["beforeProps", "afterCreate", "beforeInsert", "beforeDelete", "beforeUpdate", "afterUpdate", "beforePatch", "afterPatch", "beforeUnmount", "afterMount"], noop);
var numberMap = {
    "[object Boolean]": 2,
    "[object Number]": 3,
    "[object String]": 4,
    "[object Function]": 5,
    "[object Symbol]": 6,
    "[object Array]": 7
};
function typeNumber(data) {
    if (data === null) {
        return 1;
    }
    if (data === void 666) {
        return 0;
    }
    var a = numberMap[__type.call(data)];
    return a || 8;
}

function createRenderer(methods) {
    return extend(Renderer, methods);
}
var Renderer = {
    interactQueue: null,
    mainThread: [],
    controlledCbs: [],
    mountOrder: 1,
    currentOwner: null
};

var RESERVED_PROPS = {
    key: true,
    ref: true,
    __self: true,
    __source: true
};
function makeProps(type, config, props, children, len) {
    var defaultProps = void 0,
        propName = void 0;
    for (propName in config) {
        if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
            props[propName] = config[propName];
        }
    }
    if (type && type.defaultProps) {
        defaultProps = type.defaultProps;
        for (propName in defaultProps) {
            if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    if (len === 1) {
        props.children = children[0];
    } else if (len > 1) {
        props.children = children;
    }
    return props;
}
function hasValidRef(config) {
    return config.ref !== undefined;
}
function hasValidKey(config) {
    return config.key !== undefined;
}
function createElement(type, config) {
    for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        children[_key - 2] = arguments[_key];
    }
    var props = {},
        tag = 5,
        key = null,
        ref = null,
        argsLen = children.length;
    if (type && type.call) {
        tag = type.prototype && type.prototype.render ? 2 : 1;
    } else if (type + "" !== type) {
        toWarnDev("React.createElement: type is invalid.");
    }
    if (config != null) {
        if (hasValidRef(config)) {
            ref = config.ref;
        }
        if (hasValidKey(config)) {
            key = "" + config.key;
        }
    }
    props = makeProps(type, config || {}, props, children, argsLen);
    return ReactElement(type, tag, props, key, ref, Renderer.currentOwner);
}
function cloneElement(element, config) {
    var props = Object.assign({}, element.props);
    var type = element.type;
    var key = element.key;
    var ref = element.ref;
    var tag = element.tag;
    var owner = element._owner;
    for (var _len2 = arguments.length, children = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        children[_key2 - 2] = arguments[_key2];
    }
    var argsLen = children.length;
    if (config != null) {
        if (hasValidRef(config)) {
            ref = config.ref;
            owner = Renderer.currentOwner;
        }
        if (hasValidKey(config)) {
            key = "" + config.key;
        }
    }
    props = makeProps(type, config || {}, props, children, argsLen);
    return ReactElement(type, tag, props, key, ref, owner);
}
function createFactory(type) {
    var factory = createElement.bind(null, type);
    factory.type = type;
    return factory;
}
function ReactElement(type, tag, props, key, ref, owner) {
    var ret = {
        type: type,
        tag: tag,
        props: props
    };
    if (tag !== 6) {
        ret.$$typeof = REACT_ELEMENT_TYPE;
        ret.key = key || null;
        var refType = typeNumber(ref);
        if (refType === 2 || refType === 3 || refType === 4 || refType === 5 || refType === 8) {
            if (refType < 4) {
                ref += "";
            }
            ret.ref = ref;
        } else {
            ret.ref = null;
        }
        ret._owner = owner;
    }
    options.afterCreate(ret);
    return ret;
}
function isValidElement(vnode) {
    return !!vnode && vnode.$$typeof === REACT_ELEMENT_TYPE;
}
function createVText(type, text) {
    var vnode = ReactElement(type, 6, { children: text });
    return vnode;
}
var lastText = void 0;
var flattenIndex = void 0;
var flattenObject = void 0;
function flattenCb(child, key) {
    var childType = typeNumber(child);
    var textType = childType === 3 || childType === 4;
    if (textType) {
        if (lastText) {
            lastText.props.children += child;
            return;
        }
        lastText = child = createVText("#text", child + "");
    } else if (childType < 7) {
        lastText = null;
        return;
    } else {
        lastText = null;
    }
    if (!flattenObject["." + key]) {
        flattenObject["." + key] = child;
    } else {
        key = "." + flattenIndex;
        flattenObject[key] = child;
    }
    flattenIndex++;
}
function fiberizeChildren(c, fiber) {
    flattenObject = {};
    flattenIndex = 0;
    if (c !== void 666) {
        lastText = null;
        operateChildren(c, "", flattenCb, isIterable(c), true);
    }
    flattenIndex = 0;
    return fiber._children = flattenObject;
}
function computeName(el, i, prefix, isTop) {
    var k = i + "";
    if (el) {
        if (el.type == Fragment) {
            k = el.key ? "" : k;
        } else {
            k = el.key ? "$" + el.key : k;
        }
    }
    if (!isTop && prefix) {
        return prefix + ":" + k;
    }
    return k;
}
function isIterable(el) {
    if (el instanceof Object) {
        if (el.forEach) {
            return 1;
        }
        if (el.type === Fragment) {
            return 2;
        }
        var t = getIteractor(el);
        if (t) {
            return t;
        }
    }
    return 0;
}
function operateChildren(children, prefix, callback, iterableType, isTop) {
    var key = void 0,
        el = void 0,
        t = void 0,
        iterator = void 0;
    switch (iterableType) {
        case 0:
            if (Object(children) === children && !children.call && !children.type) {
                throw "React.createElement: type is invalid.";
            }
            key = prefix || (children && children.key ? "$" + children.key : "0");
            callback(children, key);
            break;
        case 1:
            children.forEach(function (el, i) {
                operateChildren(el, computeName(el, i, prefix, isTop), callback, isIterable(el), false);
            });
            break;
        case 2:
            key = children && children.key ? "$" + children.key : "";
            key = isTop ? key : prefix ? prefix + ":0" : key || "0";
            el = children.props.children;
            t = isIterable(el);
            if (!t) {
                el = [el];
                t = 1;
            }
            operateChildren(el, key, callback, t, false);
            break;
        default:
            iterator = iterableType.call(children);
            var ii = 0,
                step;
            while (!(step = iterator.next()).done) {
                el = step.value;
                operateChildren(el, computeName(el, ii, prefix, isTop), callback, isIterable(el), false);
                ii++;
            }
            break;
    }
}
var REAL_SYMBOL = hasSymbol && Symbol.iterator;
var FAKE_SYMBOL = "@@iterator";
function getIteractor(a) {
    var iteratorFn = REAL_SYMBOL && a[REAL_SYMBOL] || a[FAKE_SYMBOL];
    if (iteratorFn && iteratorFn.call) {
        return iteratorFn;
    }
}

var mapStack = [];
function mapWrapperCb(old, prefix) {
    if (old === void 0 || old === false || old === true) {
        old = null;
    }
    var cur = mapStack[0];
    var el = cur.callback.call(cur.context, old, cur.index);
    var index = cur.index;
    cur.index++;
    if (cur.isEach || el == null) {
        return;
    }
    if (el.tag < 6) {
        var key = computeKey(old, el, prefix, index);
        cur.arr.push(cloneElement(el, { key: key }));
    } else if (el.type) {
        cur.arr.push(extend({}, el));
    } else {
        cur.arr.push(el);
    }
}
function K(el) {
    return el;
}
var Children = {
    only: function only(children) {
        if (children && children.tag) {
            return children;
        }
        throw new Error("expect only one child");
    },
    count: function count(children) {
        if (children == null) {
            return 0;
        }
        var index = 0;
        Children.map(children, function () {
            index++;
        }, null, true);
        return index;
    },
    map: function map(children, callback, context, isEach) {
        if (children == null) {
            return children;
        }
        mapStack.unshift({
            index: 0,
            callback: callback,
            context: context,
            isEach: isEach,
            arr: []
        });
        operateChildren(children, "", mapWrapperCb, isIterable(children), true);
        var top = mapStack.shift();
        return top.arr;
    },
    forEach: function forEach(children, callback, context) {
        Children.map(children, callback, context, true);
    },
    toArray: function toArray$$1(children) {
        if (children == null) {
            return [];
        }
        return Children.map(children, K);
    }
};
function computeKey(old, el, prefix, index) {
    var curKey = el && el.key != null ? el.key : null;
    var oldKey = old && old.key != null ? old.key : null;
    var dot = "." + prefix;
    if (oldKey && curKey && oldKey !== curKey) {
        return curKey + "/" + dot;
    }
    if (prefix) {
        return dot;
    }
    return curKey ? "." + curKey : "." + index;
}

var check = function check() {
    return check;
};
check.isRequired = check;
var PropTypes = {
    array: check,
    bool: check,
    func: check,
    number: check,
    object: check,
    string: check,
    any: check,
    arrayOf: check,
    element: check,
    instanceOf: check,
    node: check,
    objectOf: check,
    oneOf: check,
    oneOfType: check,
    shape: check
};

function Component(props, context) {
    Renderer.currentOwner = this;
    this.context = context;
    this.props = props;
    this.refs = {};
    this.state = null;
}
var fakeObject = {
    enqueueSetState: returnFalse,
    _isMounted: returnFalse
};
Component.prototype = {
    constructor: Component,
    replaceState: function replaceState() {
        toWarnDev("replaceState", true);
    },
    isReactComponent: returnTrue,
    isMounted: function isMounted() {
        toWarnDev("isMounted", true);
        return (this.updater || fakeObject)._isMounted(this);
    },
    setState: function setState(state, cb) {
        (this.updater || fakeObject).enqueueSetState(this, state, cb);
    },
    forceUpdate: function forceUpdate(cb) {
        (this.updater || fakeObject).enqueueSetState(this, true, cb);
    },
    render: function render() {
        throw "must implement render";
    }
};

function shallowEqual(objA, objB) {
    if (Object.is(objA, objB)) {
        return true;
    }
    if (typeNumber(objA) < 7 || typeNumber(objB) < 7) {
        return false;
    }
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (var i = 0; i < keysA.length; i++) {
        if (!hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }
    return true;
}

function PureComponent(props, context) {
    Component.call(this, props, context);
}
var fn = inherit(PureComponent, Component);
fn.shouldComponentUpdate = function (nextProps, nextState) {
    var a = shallowEqual(this.props, nextProps);
    var b = shallowEqual(this.state, nextState);
    return !a || !b;
};
fn.isPureComponent = true;

function createRef() {
    return {
        current: null
    };
}
function forwardRef(fn) {
    createRef.render = fn;
    return createRef;
}

function AnuPortal(props) {
    return props.children;
}
function createPortal(children, parent) {
    var child = createElement(AnuPortal, { children: children, parent: parent });
    return child;
}

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var uuid = 1;
function gud() {
    return uuid++;
}
var MAX_NUMBER = 1073741823;
function createEventEmitter(value) {
    var handlers = [];
    return {
        on: function on(handler) {
            handlers.push(handler);
        },
        off: function off(handler) {
            handlers = handlers.filter(function (h) {
                return h !== handler;
            });
        },
        get: function get$$1() {
            return value;
        },
        set: function set(newValue, changedBits) {
            value = newValue;
            handlers.forEach(function (handler) {
                return handler(value, changedBits);
            });
        }
    };
}
function createContext(defaultValue, calculateChangedBits) {
    var contextProp = "__create-react-context-" + gud() + "__";
    function Provider(props, context) {
        Component.call(this, props, context);
        this.emitter = createEventEmitter(props.value);
    }
    Provider.childContextTypes = _defineProperty({}, contextProp, PropTypes.object.isRequired);
    var fn = inherit(Provider, Component);
    fn.getChildContext = function () {
        return _defineProperty({}, contextProp, this.emitter);
    };
    fn.componentWillReceiveProps = function (nextProps) {
        if (this.props.value !== nextProps.value) {
            var oldValue = this.props.value;
            var newValue = nextProps.value;
            var changedBits = void 0;
            if (Object.is(oldValue, newValue)) {
                changedBits = 0;
            } else {
                changedBits = typeof calculateChangedBits === "function" ? calculateChangedBits(oldValue, newValue) : MAX_NUMBER;
                changedBits |= 0;
                if (changedBits !== 0) {
                    this.emitter.set(nextProps.value, changedBits);
                }
            }
        }
    };
    fn.render = function () {
        return this.props.children;
    };
    function Consumer(props, context) {
        var _this = this;
        Component.call(this, props, context);
        this.observedBits = 0;
        this.state = {
            value: this.getValue()
        };
        this.onUpdate = function (newValue, changedBits) {
            var observedBits = _this.observedBits | 0;
            if ((observedBits & changedBits) !== 0) {
                _this.setState({ value: _this.getValue() });
            }
        };
    }
    Consumer.contextTypes = _defineProperty({}, contextProp, PropTypes.object);
    var fn2 = inherit(Consumer, Component);
    fn2.componentWillReceiveProps = function (nextProps) {
        var observedBits = nextProps.observedBits;
        this.observedBits = observedBits === undefined || observedBits === null ? MAX_NUMBER
        : observedBits;
    };
    fn2.getValue = function () {
        if (this.context[contextProp]) {
            return this.context[contextProp].get();
        } else {
            return defaultValue;
        }
    };
    fn2.componentDidMount = function () {
        if (this.context[contextProp]) {
            this.context[contextProp].on(this.onUpdate);
        }
        var observedBits = this.props.observedBits;
        this.observedBits = observedBits === undefined || observedBits === null ? MAX_NUMBER
        : observedBits;
    };
    fn2.componentWillUnmount = function () {
        if (this.context[contextProp]) {
            this.context[contextProp].off(this.onUpdate);
        }
    };
    fn2.render = function () {
        return this.props.children(this.state.value);
    };
    return {
        Provider: Provider,
        Consumer: Consumer
    };
}

var componentStack = [];
var effects = [];
var containerStack = [];
var contextStack = [emptyObject];

function hasContextChanged() {
    return contextStack[0] != emptyObject;
}

var NOWORK = 1;
var PLACE = 2;
var CONTENT = 3;
var ATTR = 5;
var NULLREF = 7;
var DETACH = 11;
var HOOK = 13;
var CHANGEREF = 17;
var REF = 19;
var CALLBACK = 23;
var CAPTURE = 29;
var effectNames = [PLACE, CONTENT, ATTR, NULLREF, HOOK, CHANGEREF, REF, DETACH, CALLBACK, CAPTURE].sort(function (a, b) {
    return a - b;
});
var effectLength = effectNames.length;

var updateQueue$1 = Renderer.mainThread;
function pushError(fiber, hook, error) {
    var names = [];
    var catchFiber = findCatchComponent(fiber, names);
    var stack = describeError(names, hook);
    if (catchFiber) {
        disableEffect(fiber);
        catchFiber.errorInfo = catchFiber.errorInfo || [error, { componentStack: stack }];
        delete catchFiber._children;
        delete catchFiber.child;
        catchFiber.effectTag = CAPTURE;
        updateQueue$1.push(catchFiber);
    } else {
        if (!Renderer.error) {
            Renderer.error = error;
        }
    }
}
function callLifeCycleHook(instance, hook, args) {
    try {
        var fn = instance[hook];
        if (fn) {
            return fn.apply(instance, args);
        }
        return true;
    } catch (error) {
        if (hook === "componentWillUnmount") {
            instance[hook] = noop;
        }
        pushError(get(instance), hook, error);
    }
}
function describeError(names, hook) {
    var segments = ["**" + hook + "** method occur error "];
    names.forEach(function (name, i) {
        if (names[i + 1]) {
            segments.push("in " + name + " (created By " + names[i + 1] + ")");
        }
    });
    return segments.join("\n").trim();
}
function disableEffect(fiber) {
    if (fiber.stateNode) {
        fiber.stateNode.render = noop;
    }
    fiber.effectTag = NOWORK;
    for (var child = fiber.child; child; child = child.sibling) {
        disableEffect(fiber);
    }
}
function findCatchComponent(topFiber, names) {
    var instance = void 0,
        name = void 0,
        fiber = topFiber,
        catchIt = void 0;
    do {
        name = fiber.name;
        if (!fiber.return) {
            if (catchIt) {
                return catchIt;
            }
            break;
        } else if (fiber.tag < 4) {
            names.push(name);
            instance = fiber.stateNode;
            if (instance.componentDidCatch) {
                if (instance.updater._isDoctor) {
                    disableEffect(fiber);
                } else if (!catchIt && fiber !== topFiber) {
                    catchIt = fiber;
                }
            }
        } else if (fiber.tag === 5) {
            names.push(name);
        }
    } while (fiber = fiber.return);
}

function createInstance(fiber, context) {
    var updater = {
        mountOrder: Renderer.mountOrder++,
        enqueueSetState: returnFalse,
        _isMounted: returnFalse
    };
    var props = fiber.props,
        type = fiber.type,
        tag = fiber.tag,
        ref = fiber.ref,
        isStateless = tag === 1,
        lastOwn = Renderer.currentOwner,
        instance = fiber.stateNode = {};
    try {
        if (isStateless) {
            instance = {
                refs: {},
                props: props,
                context: context,
                ref: ref,
                __proto__: type.prototype,
                __isStateless: returnTrue,
                __init: true,
                renderImpl: type,
                render: function f() {
                    var a = this.__keep;
                    if (a) {
                        delete this.__keep;
                        return a;
                    }
                    a = this.renderImpl(this.props, this.context);
                    if (a && a.render) {
                        delete this.__isStateless;
                        for (var i in a) {
                            instance[i == "render" ? "renderImpl" : i] = a[i];
                        }
                    } else if (this.__init) {
                        this.__keep = a;
                    }
                    return a;
                }
            };
            Renderer.currentOwner = instance;
            if (type.render) {
                instance.oneRef = function (a) {
                    var ref = instance.ref;
                    if (isFn(ref)) {
                        ref(a);
                        instance.ref = noop;
                    } else if (ref && "current" in ref) {
                        ref.current = a;
                    }
                };
                instance.render = function () {
                    return type.render(this.props, this.oneRef);
                };
            } else {
                instance.render();
                delete instance.__init;
            }
        } else {
            instance = new type(props, context);
        }
    } catch (e) {
        pushError(fiber, "constructor", e);
    } finally {
        Renderer.currentOwner = lastOwn;
    }
    fiber.stateNode = instance;
    instance.props = props;
    instance.updater = updater;
    return instance;
}

function Fiber(vnode) {
    extend(this, vnode);
    var type = vnode.type;
    this.name = type.displayName || type.name || type;
    this.effectTag = 1;
}

function updateEffects(fiber, topWork) {
    if (fiber.tag > 3) {
        updateHostComponent(fiber);
    } else {
        updateClassComponent(fiber);
    }
    if (!fiber.shouldUpdateFalse) {
        if (fiber.child) {
            return fiber.child;
        }
    }
    var f = fiber;
    while (f) {
        if (f.stateNode.getChildContext) {
            var useTest = contextStack.shift();
        }
        if (f.tag === 5) {
            containerStack.shift();
        }
        if (f === topWork) {
            break;
        }
        if (f.sibling) {
            return f.sibling;
        }
        f = f.return;
    }
}
function updateHostComponent(fiber) {
    if (!fiber.stateNode) {
        try {
            fiber.stateNode = Renderer.createElement(fiber);
        } catch (e) {
            throw e;
        }
    }
    fiber.parent = fiber.type === AnuPortal ? fiber.props.parent : containerStack[0];
    var props = fiber.props,
        tag = fiber.tag,
        root = fiber.root,
        prev = fiber.alternate;
    var children = props && props.children;
    if (tag === 5) {
        containerStack.unshift(fiber.stateNode);
        if (!root) {
            fiber.effectTag *= ATTR;
        }
        if (prev) {
            fiber._children = prev._children;
        }
        diffChildren(fiber, children);
    } else {
        if (!prev || prev.props.children !== children) {
            fiber.effectTag *= CONTENT;
        }
    }
}
function mergeStates(fiber, nextProps, keep) {
    var instance = fiber.stateNode,
        pendings = fiber.pendingStates || [],
        n = pendings.length,
        state = instance.state;
    if (n === 0) {
        return state;
    }
    var nextState = extend({}, state);
    for (var i = 0; i < n; i++) {
        var pending = pendings[i];
        if (pending && pending.call) {
            pending = pending.call(instance, nextState, nextProps);
        }
        extend(nextState, pending);
    }
    if (keep) {
        pendings.length = 0;
        pendings.push(nextState);
    } else {
        delete fiber.pendingStates;
    }
    return nextState;
}
function updateClassComponent(fiber) {
    var type = fiber.type,
        instance = fiber.stateNode,
        isForced = fiber.isForced,
        props = fiber.props,
        stage = fiber.stage;
    fiber.parent = fiber.type === AnuPortal ? fiber.props.parent : containerStack[0];
    var nextContext = getMaskedContext(type.contextTypes, instance),
        context = void 0;
    if (instance == null) {
        stage = "init";
        instance = fiber.stateNode = createInstance(fiber, nextContext);
        instance.updater.enqueueSetState = Renderer.updateComponent;
        instance.props = props;
    } else {
        var isSetState = isForced === true || fiber.pendingStates || fiber._updates;
        if (isSetState) {
            stage = "update";
            var u = fiber._updates;
            if (u) {
                isForced = fiber.isForced || u.isForced;
                fiber.pendingStates = u.pendingStates;
                var hasCb = fiber.pendingCbs = u.pendingCbs;
                if (hasCb) {
                    fiber.effectTag *= CALLBACK;
                }
                delete fiber._updates;
            }
            delete fiber.isForced;
        } else {
            stage = "receive";
        }
    }
    instance._reactInternalFiber = fiber;
    if (instance.__isStateless) {
        stage = "noop";
    }
    var updater = instance.updater;
    updater._hooking = true;
    while (stage) {
        stage = stageIteration[stage](fiber, props, nextContext, instance, isForced);
    }
    updater._hooking = false;
    var ps = fiber.pendingStates;
    if (ps && ps.length) {
        instance.state = mergeStates(fiber, props);
    }
    delete fiber.isForced;
    instance.props = props;
    if (instance.getChildContext) {
        try {
            context = instance.getChildContext();
            context = Object.assign({}, nextContext, context);
        } catch (e) {
            context = {};
        }
        contextStack.unshift(context);
    }
    instance.context = nextContext;
    if (fiber.shouldUpdateFalse) {
        return;
    }
    fiber.effectTag *= HOOK;
    updater._hydrating = true;
    var lastOwn = Renderer.currentOwner;
    Renderer.currentOwner = instance;
    var rendered = callLifeCycleHook(instance, "render", []);
    if (componentStack[0] === instance) {
        componentStack.shift();
    }
    if (updater._hasError) {
        rendered = [];
    }
    Renderer.currentOwner = lastOwn;
    diffChildren(fiber, rendered);
}
var stageIteration = {
    noop: noop,
    init: function init(fiber, nextProps, nextContext, instance) {
        getDerivedStateFromProps(instance, fiber, nextProps, instance.state);
        callUnsafeHook(instance, "componentWillMount", []);
    },
    receive: function receive(fiber, nextProps, nextContext, instance) {
        var updater = instance.updater;
        updater.lastProps = instance.props;
        updater.lastState = instance.state;
        var propsChange = updater.lastProps !== nextProps;
        var willReceive = propsChange || hasContextChanged() || instance.context !== nextContext;
        if (willReceive) {
            callUnsafeHook(instance, "componentWillReceiveProps", [nextProps, nextContext]);
        } else {
            cloneChildren(fiber);
            return;
        }
        if (propsChange) {
            getDerivedStateFromProps(instance, fiber, nextProps, updater.lastState);
        }
        return "update";
    },
    update: function update(fiber, nextProps, nextContext, instance, isForced) {
        var args = [nextProps, mergeStates(fiber, nextProps, true), nextContext];
        delete fiber.shouldUpdateFalse;
        if (!isForced && !callLifeCycleHook(instance, "shouldComponentUpdate", args)) {
            cloneChildren(fiber);
        } else {
            callLifeCycleHook(instance, "getSnapshotBeforeUpdate", args);
            callUnsafeHook(instance, "componentWillUpdate", args);
        }
    }
};
function callUnsafeHook(a, b, c) {
    callLifeCycleHook(a, b, c);
    callLifeCycleHook(a, "UNSAFE_" + b, c);
}
function isSameNode(a, b) {
    if (a.type === b.type && a.key === b.key) {
        return true;
    }
}
function detachFiber(fiber, effects$$1) {
    fiber.effectTag = DETACH;
    if (fiber.ref) {
        fiber.effectTag *= NULLREF;
    }
    fiber.disposed = true;
    effects$$1.push(fiber);
    for (var child = fiber.child; child; child = child.sibling) {
        detachFiber(child, effects$$1);
    }
}
var gDSFP = "getDerivedStateFromProps";
function getDerivedStateFromProps(instance, fiber, nextProps, lastState) {
    try {
        var method = fiber.type[gDSFP];
        if (method) {
            var partialState = method.call(null, nextProps, lastState);
            if (typeNumber(partialState) === 8) {
                instance.updater.enqueueSetState(instance, partialState);
            }
        }
    } catch (error) {
        pushError(instance, gDSFP, error);
    }
}
function cloneChildren(fiber) {
    fiber.shouldUpdateFalse = true;
    var prev = fiber.alternate;
    if (prev && prev.child) {
        var pc = prev._children;
        var cc = fiber._children = {};
        fiber.child = prev.child;
        for (var i in pc) {
            var a = pc[i];
            a.return = fiber;
            cc[i] = a;
        }
    }
    if (componentStack[0] === fiber.stateNode) {
        componentStack.shift();
    }
}
function getMaskedContext(contextTypes, instance) {
    if (instance && !contextTypes) {
        return instance.context;
    }
    var context = {};
    if (!contextTypes) {
        return context;
    }
    var parentContext = contextStack[0];
    for (var key in contextTypes) {
        if (contextTypes.hasOwnProperty(key)) {
            context[key] = parentContext[key];
        }
    }
    return context;
}
function diffChildren(parentFiber, children) {
    var oldFibers = parentFiber._children || {};
    var newFibers = fiberizeChildren(children, parentFiber);
    var effects$$1 = parentFiber.effects || (parentFiber.effects = []);
    var matchFibers = {};
    for (var i in oldFibers) {
        var newFiber = newFibers[i];
        var oldFiber = oldFibers[i];
        if (newFiber && newFiber.type === oldFiber.type) {
            matchFibers[i] = oldFiber;
            if (newFiber.key != null) {
                oldFiber.key = newFiber.key;
            }
            continue;
        }
        detachFiber(oldFiber, effects$$1);
    }
    if (parentFiber.tag === 5) {
        var firstChild = parentFiber.stateNode.firstChild;
        if (firstChild) {
            for (var _i in oldFibers) {
                var child = oldFibers[_i];
                do {
                    if (child._return) {
                        break;
                    }
                    if (child.tag > 4) {
                        child.stateNode = firstChild;
                        break;
                    }
                } while (child = child.child);
                break;
            }
        }
    }
    var prevFiber = void 0,
        index = 0,
        newEffects = [];
    for (var _i2 in newFibers) {
        var _newFiber = newFibers[_i2];
        var _oldFiber = matchFibers[_i2];
        if (_oldFiber) {
            if (isSameNode(_oldFiber, _newFiber)) {
                var alternate = new Fiber(_oldFiber);
                _newFiber = extend(_oldFiber, _newFiber);
                _newFiber.alternate = alternate;
                if (alternate.ref && alternate.ref !== _newFiber.ref) {
                    alternate.effectTag *= NULLREF;
                    effects$$1.push(alternate);
                }
                if (_newFiber.tag === 5) {
                    _newFiber.lastProps = alternate.props;
                }
            } else {
                detachFiber(_oldFiber, effects$$1);
            }
            newEffects.push(_newFiber);
        } else {
            _newFiber = new Fiber(_newFiber);
        }
        newFibers[_i2] = _newFiber;
        if (_newFiber.tag > 3) {
            _newFiber.effectTag *= PLACE;
        }
        if (_newFiber.ref) {
            _newFiber.effectTag *= REF;
        }
        _newFiber.index = index++;
        _newFiber.return = parentFiber;
        if (prevFiber) {
            prevFiber.sibling = _newFiber;
        } else {
            parentFiber.child = _newFiber;
            if (_newFiber.tag > 3 && _newFiber.alternate) {
            }
        }
        prevFiber = _newFiber;
    }
    if (prevFiber) {
        delete prevFiber.sibling;
    }
}

function collectEffects(fiber, shouldUpdateFalse, isTop) {
    if (!fiber) {
        return [];
    }
    var effects = fiber.effects;
    if (effects) {
        delete fiber.effects;
    } else {
        effects = [];
    }
    if (isTop && fiber.tag == 5) {
        fiber.stateNode.insertPoint = null;
    }
    for (var child = fiber.child; child; child = child.sibling) {
        var isHost = child.tag > 3;
        if (isHost) {
            child.insertPoint = child.parent.insertPoint;
            child.parent.insertPoint = child.stateNode;
        } else {
            child.insertPoint = child.parent.insertPoint;
        }
        if (shouldUpdateFalse || child.shouldUpdateFalse) {
            if (isHost) {
                if (!child.disposed) {
                    child.effectTag *= PLACE;
                    effects.push(child);
                }
            } else {
                delete child.shouldUpdateFalse;
                __push.apply(effects, collectEffects(child, true));
            }
        } else {
            __push.apply(effects, collectEffects(child));
        }
        if (child.effectTag) {
            effects.push(child);
        }
    }
    return effects;
}
function getContainer(p) {
    if (p.parent) {
        return p.parent;
    }
    while (p = p.return) {
        if (p.tag === 5) {
            return p.stateNode;
        }
    }
}

function getDOMNode() {
    return this;
}
var Refs = {
    fireRef: function fireRef(fiber, dom) {
        var ref = fiber.ref;
        var owner = fiber._owner;
        try {
            if (isFn(ref)) {
                return ref(dom);
            }
            if (!owner) {
                throw "Element ref was specified as a string (" + ref + ") but no owner was set";
            }
            if (dom) {
                if (dom.nodeType) {
                    dom.getDOMNode = getDOMNode;
                }
                owner.refs[ref] = dom;
            } else {
                delete owner.refs[ref];
            }
        } catch (e) {
            pushError(owner, "ref", e);
        }
    }
};

function commitEffects(a) {
    var arr = a || effects;
    arr = commitPlaceEffects(arr);
    for (var i = 0; i < arr.length; i++) {
        commitOtherEffects(arr[i]);
        if (Renderer.error) {
            arr.length = 0;
            break;
        }
    }
    arr.forEach(commitOtherEffects);
    arr.length = effects.length = 0;
    var error = Renderer.error;
    if (error) {
        delete Renderer.error;
        throw error;
    }
}
function commitPlaceEffects(fibers) {
    var ret = [];
    for (var i = 0, n = fibers.length; i < n; i++) {
        var fiber = fibers[i];
        var amount = fiber.effectTag;
        var remainder = amount / PLACE;
        var hasEffect = amount > 1;
        if (hasEffect && remainder == ~~remainder) {
            try {
                fiber.parent.insertPoint = null;
                Renderer.insertElement(fiber);
            } catch (e) {
                throw e;
            }
            fiber.effectTag = remainder;
            hasEffect = remainder > 1;
        }
        if (hasEffect) {
            ret.push(fiber);
        }
    }
    return ret;
}
function commitOtherEffects(fiber) {
    var instance = fiber.stateNode || emptyObject;
    var amount = fiber.effectTag;
    var updater = instance.updater;
    for (var i = 0; i < effectLength; i++) {
        var effectNo = effectNames[i];
        if (effectNo > amount) {
            break;
        }
        if (amount % effectNo === 0) {
            amount /= effectNo;
            switch (effectNo) {
                case PLACE:
                    Renderer.insertElement(fiber);
                    break;
                case CONTENT:
                    Renderer.updateContext(fiber);
                    break;
                case ATTR:
                    Renderer.updateAttribute(fiber);
                    break;
                case NULLREF:
                    if (!instance.__isStateless) {
                        Refs.fireRef(fiber, null);
                    }
                    break;
                case DETACH:
                    if (fiber.tag > 3) {
                        Renderer.removeElement(fiber);
                    } else {
                        updater.enqueueSetState = returnFalse;
                        callLifeCycleHook(instance, "componentWillUnmount", []);
                        updater._isMounted = returnFalse;
                    }
                    delete fiber.stateNode;
                    delete fiber.alternate;
                    break;
                case HOOK:
                    if (updater._isMounted()) {
                        callLifeCycleHook(instance, "componentDidUpdate", [updater.lastProps, updater.lastState]);
                    } else {
                        updater._isMounted = returnTrue;
                        callLifeCycleHook(instance, "componentDidMount", []);
                    }
                    delete fiber.pendingFiber;
                    delete updater._hydrating;
                    break;
                case REF:
                    if (!instance.__isStateless) {
                        Refs.fireRef(fiber, instance);
                    }
                    break;
                case CALLBACK:
                    var queue = fiber.pendingCbs;
                    queue.forEach(function (fn) {
                        fn.call(instance);
                    });
                    delete fiber.pendingCbs;
                    break;
                case CAPTURE:
                    updater._isDoctor = true;
                    instance.componentDidCatch.apply(instance, fiber.errorInfo);
                    fiber.errorInfo = null;
                    updater._isDoctor = false;
                    break;
            }
        }
    }
    fiber.effectTag = 1;
}

var updateQueue = Renderer.mainThread;
function render$1(vnode, root, callback) {
    var hostRoot = Renderer.updateRoot(root);
    var instance = null;
    if (hostRoot._hydrating) {
        hostRoot.pendingCbs.push(function () {
            render$1(vnode, root, callback);
        });
        return;
    }
    hostRoot.props = {
        children: vnode
    };
    hostRoot.pendingCbs = [function () {
        instance = hostRoot.child ? hostRoot.child.stateNode : null;
        callback && callback.call(instance);
        hostRoot._hydrating = false;
    }];
    hostRoot._hydrating = true;
    hostRoot.effectTag = CALLBACK;
    updateQueue.push(hostRoot);
    Renderer.scheduleWork();
    return instance;
}
Renderer.scheduleWork = function () {
    performWork({
        timeRemaining: function timeRemaining() {
            return 2;
        }
    });
};
var isBatchingUpdates = false;
Renderer.batchedUpdates = function () {
    var keepbook = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
        Renderer.scheduleWork();
    } finally {
        isBatchingUpdates = keepbook;
        if (!isBatchingUpdates) {
            commitEffects();
        }
    }
};
function workLoop(deadline) {
    var topWork = getNextUnitOfWork();
    if (topWork) {
        var fiber = topWork;
        var p = getContainer(fiber);
        if (p) {
            containerStack.unshift(p);
        }
        while (fiber && deadline.timeRemaining() > ENOUGH_TIME) {
            fiber = updateEffects(fiber, topWork);
        }
        if (topWork) {
            __push.apply(effects, collectEffects(topWork, null, true));
            if (topWork.effectTag) {
                effects.push(topWork);
            }
        }
        if (!isBatchingUpdates) {
            commitEffects();
        }
    }
}
function performWork(deadline) {
    workLoop(deadline);
    if (updateQueue.length > 0) {
        requestIdleCallback(performWork);
    }
}
var ENOUGH_TIME = 1;
function requestIdleCallback(fn) {
    fn({
        timeRemaining: function timeRemaining() {
            return 2;
        }
    });
}
function getNextUnitOfWork(fiber) {
    fiber = updateQueue.shift();
    if (!fiber) {
        return;
    }
    if (fiber.merged) {
        return;
    }
    if (fiber.root) {
        fiber.stateNode = fiber.stateNode || {};
        if (!get(fiber.stateNode)) {
            Renderer.emptyElement(fiber);
        }
        fiber.stateNode._reactInternalFiber = fiber;
    }
    return fiber;
}
function mergeUpdates(el, state, isForced, callback) {
    var fiber = el._updates || el;
    if (isForced) {
        fiber.isForced = true;
    }
    if (state) {
        var ps = fiber.pendingStates || (fiber.pendingStates = []);
        ps.push(state);
    }
    if (callback) {
        var cs = fiber.pendingCbs || (fiber.pendingCbs = []);
        if (!cs.length) {
            if (!fiber.effectTag) {
                fiber.effectTag = CALLBACK;
            } else {
                fiber.effectTag *= CALLBACK;
            }
        }
        cs.push(callback);
    }
}
Renderer.updateComponent = function (instance, state, callback) {
    var fiber = get(instance);
    if (fiber.parent) {
        fiber.parent.insertPoint = fiber.insertPoint;
    }
    var isForced = state === true;
    state = isForced ? null : state;
    if (this._hydrating || Renderer.interactQueue) {
        if (!fiber._updates) {
            fiber._updates = {};
            var queue = Renderer.interactQueue || updateQueue;
            queue.push(fiber);
        }
        mergeUpdates(fiber, state, isForced, callback);
    } else {
        mergeUpdates(fiber, state, isForced, callback);
        if (!this._hooking) {
            updateQueue.push(fiber);
            Renderer.scheduleWork();
        }
    }
};

function cleanChildren(array) {
    if (!Array.isArray(array)) {
        return array;
    }
    return array.map(function (el) {
        if (el.type == "#text") {
            return el.children;
        } else {
            return {
                type: el.type,
                props: el.props,
                children: cleanChildren(el.children)
            };
        }
    });
}
var rootContainer = {
    type: "root",
    props: null,
    children: []
};
var yieldData = [];
var NoopRenderer = createRenderer({
    render: render$1,
    updateAttribute: function updateAttribute() {},
    updateContext: function updateContext(fiber) {
        fiber.stateNode.children = fiber.props.children;
    },
    reset: function reset() {
        rootContainer = {
            type: "root",
            props: null,
            children: []
        };
    },
    updateRoot: function updateRoot(vnode) {
        return {
            type: "root",
            root: true,
            stateNode: rootContainer,
            props: {
                children: vnode
            },
            tag: 5,
            alternate: get(rootContainer)
        };
    },
    getRoot: function getRoot() {
        return rootContainer;
    },
    getChildren: function getChildren() {
        return cleanChildren(rootContainer.children || []);
    },
    yield: function _yield(a) {
        yieldData.push(a);
    },
    flush: function flush() {
        var ret = yieldData.concat();
        yieldData.length = 0;
        return ret;
    },
    createElement: function createElement(fiber) {
        return {
            type: fiber.type,
            props: null,
            children: fiber.tag === 6 ? fiber.props.children : []
        };
    },
    insertElement: function insertElement(fiber) {
        var dom = fiber.stateNode,
            parentNode = fiber.parent,
            before = fiber.insertPoint,
            children = parentNode.children;
        try {
            if (before == null) {
                if (dom !== children[0]) {
                    remove(children, dom);
                    children.unshift(dom);
                }
            } else {
                if (dom !== children[children.length - 1]) {
                    remove(children, dom);
                    var i = children.indexOf(before);
                    children.splice(i + 1, 0, dom);
                }
            }
        } catch (e) {
            throw e;
        }
    },
    emptyElement: function emptyElement(fiber) {
        var dom = fiber.stateNode;
        var children = dom && dom.children;
        if (dom && Array.isArray(children)) {
            children.forEach(NoopRenderer.removeElement);
        }
    },
    removeElement: function removeElement(fiber) {
        if (fiber.parent) {
            var parent = fiber.parent;
            var node = fiber.stateNode;
            remove(parent.children, node);
        }
    }
});
function remove(children, node) {
    var index = children.indexOf(node);
    if (index !== -1) {
        children.splice(index, 1);
    }
}

var win = getWindow();
var prevReact = win.ReactNoop;
var ReactNoop = void 0;
if (prevReact && prevReact.isReactNoop) {
    ReactNoop = prevReact;
} else {
    var render = NoopRenderer.render,
        flush = NoopRenderer.flush,
        reset = NoopRenderer.reset,
        getRoot = NoopRenderer.getRoot,
        getChildren = NoopRenderer.getChildren;
    ReactNoop = win.ReactNoop = {
        version: "1.3.1",
        render: render,
        flush: flush,
        reset: reset,
        yield: NoopRenderer.yield,
        getRoot: getRoot,
        getChildren: getChildren,
        options: options,
        isReactNoop: true,
        Fragment: Fragment,
        PropTypes: PropTypes,
        Children: Children,
        createPortal: createPortal,
        createContext: createContext,
        Component: Component,
        createRef: createRef,
        forwardRef: forwardRef,
        createElement: createElement,
        cloneElement: cloneElement,
        PureComponent: PureComponent,
        isValidElement: isValidElement,
        createFactory: createFactory
    };
}
var ReactNoop$1 = ReactNoop;

return ReactNoop$1;

})));

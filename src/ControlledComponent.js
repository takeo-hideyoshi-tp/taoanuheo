/**
 input, select, textarea这几个元素如果指定了value/checked的**状态属性**，就会包装成受控组件或非受控组件
 受控组件是指，用户除了为它指定**状态属性**，还为它指定了onChange/onInput/disabled等用于控制此状态属性
 变动的属性
 反之，它就是非受控组件，非受控组件会在框架内部添加一些事件，阻止**状态属性**被用户的行为改变，只能被setState改变
 */
import { typeNumber } from "./util";
export const formElements = {
    select: 1,
    textarea: 1,
    input: 1,
    option: 1
};
var duplexData = {
    1: [
        "value",
        {
            onChange: 1,
            onInput: 1,
            readOnly: 1,
            disabled: 1
        },
        "oninput",
        preventUserInput
    ],
    2: [
        "checked",
        {
            onChange: 1,
            onClick: 1,
            readOnly: 1,
            disabled: 1
        },
        "onclick",
        preventUserClick
    ],
    3: [
        "value",
        {
            onChange: 1,
            disabled: 1
        },
        "onchange",
        preventUserChange
    ]
};

var duplexMap = {
    color: 1,
    date: 1,
    datetime: 1,
    "datetime-local": 1,
    email: 1,
    month: 1,
    number: 1,
    password: 1,
    range: 1,
    search: 1,
    tel: 1,
    text: 1,
    time: 1,
    url: 1,
    week: 1,
    textarea: 1,
    checkbox: 2,
    radio: 2,
    "select-one": 3,
    "select-multiple": 3
};

export function processFormElement(vnode, dom, props) {
    var domType = dom.type;
    var duplexType = duplexMap[domType];
    if (duplexType) {
        var data = duplexData[duplexType];
        var duplexProp = data[0];
        var keys = data[1];
        var eventName = data[2];

        if (duplexProp in props && !hasOtherControllProperty(props, keys)) {
            // eslint-disable-next-line
            console.warn(`你为${vnode.type}[type=${domType}]元素指定了${duplexProp}属性，
      但是没有提供另外的${Object.keys(keys)}来控制${duplexProp}属性的变化
      那么它即为一个非受控组件，用户无法通过输入改变元素的${duplexProp}值`);
            dom[eventName] = data[3];
        }
        if (duplexType === 3) {
            var lastProps = vnode.lastProps || {};
            if(!!lastProps.multiple !== !!props.multiple){
                if(dom._hasSet === true){
                    //当select的multiple发生变化，需要重置selectedIndex，让底下的selected生效
                    dom.selectedIndex = dom.selectedIndex; 
                }
                dom._hasSet = false;
            }
            postUpdateSelectedOptions(vnode, dom);
        }
    } else {
        dom.duplexValue = props.value === undefined ? (typeNumber(props.children) > 4 ? dom.text : props.children) : props.value;
    }
}

function hasOtherControllProperty(props, keys) {
    for (var key in props) {
        if (keys[key]) {
            return true;
        }
    }
}

function preventUserInput(e) {
    var target = e.target;
    var name = e.type === "textarea" ? "innerHTML" : "value";
    target[name] = target._lastValue;
}

function preventUserClick(e) {
    e.preventDefault();
}

function preventUserChange(e) {
    let target = e.target,
        value = target._lastValue,
        options = target.options;
    if (target.multiple) {
        updateOptionsMore(options, options.length, value);
    } else {
        updateOptionsOne(options, options.length, value);
    }
    target._hasSet = true;
}

export function postUpdateSelectedOptions(vnode, target) {
    let props = vnode.props,
        multiple = !!props.multiple;
    if (typeNumber(props.value) > 1) {
        target._lastValue = props.value;
    } else if (typeNumber(props.defaultValue) > 1) {
        if (target._hasSet) {
            target._lastValue = multiple ? target._lastValue : target.value;
        } else {
            target._lastValue = props.defaultValue;
        }
    } else {
        if(!target._lastValue){
            target._lastValue = multiple ? [] : "";
        }
    }
    preventUserChange({
        target
    });
}

function updateOptionsOne(options, n, propValue) {
    var stringValues = {},
        noDisableds = [];
    for (let i = 0; i < n; i++) {
        let option = options[i];
        let value = option.duplexValue;
        if (!option.disabled) {
            noDisableds.push(option);
        }
        if (value === propValue) {
            //精确匹配
            return setOptionSelected(option, true);
        }else{
            // setOptionSelected(option, false);
        }
        stringValues[value] = option;
    }
    var match = stringValues[propValue];
    if (match) {
        //字符串模糊匹配
        return setOptionSelected(match, true);
    }
    if (n) {
        //选中第一个没有变disable的元素
        setOptionSelected(noDisableds[0], true);
    }
}

function updateOptionsMore(options, n, propValue) {
    var selectedValue = {};
    try {
        for (let i = 0; i < propValue.length; i++) {
            selectedValue["&" + propValue[i]] = true;
        }
    } catch (e) {
        /* istanbul ignore next */
        console.warn('<select multiple="true"> 的value应该对应一个字符串数组'); // eslint-disable-line
    }
    for (let i = 0; i < n; i++) {
        let option = options[i];
        let value = option.duplexValue;
        let selected = selectedValue.hasOwnProperty("&" + value);
        setOptionSelected(option, selected);
    }
}

function setOptionSelected(dom, selected) {
    dom.selected = selected;
}

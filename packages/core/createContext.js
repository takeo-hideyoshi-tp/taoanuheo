import { miniCreateClass, isFn } from './util';
import { Component } from './Component';


const MAX_NUMBER = 1073741823;
export function createContext(defaultValue, calculateChangedBits) {
    if (calculateChangedBits == void 0) {
        calculateChangedBits = null;
    }
    var instance = {
        value: defaultValue,
        subscribers: []
    };
    var Provider = miniCreateClass(function Provider(props) {
        this.value = props.value;
        getContext.subscribers = this.subscribers = [];
        instance = this;
    }, Component, {
        componentWillUnmount: function componentWillUnmount() {
            this.subscribers.length = 0;
        },
        UNSAFE_componentWillReceiveProps: function UNSAFE_componentWillReceiveProps(nextProps) {
            if (this.props.value !== nextProps.value) {
                var oldValue = this.props.value;
                var newValue = nextProps.value;
                var changedBits = void 0;
                if (Object.is(oldValue, newValue)) {
                    changedBits = 0;
                } else {
                    this.value = newValue;
                    changedBits = isFn(calculateChangedBits) ? calculateChangedBits(oldValue, newValue) : MAX_NUMBER;
                    changedBits |= 0;
                    if (changedBits !== 0) {
                        instance.subscribers.forEach(function (instance) {
                            instance.setState({
                                value: newValue
                            });
                            instance.forceUpdate();
                        });
                    }
                }
            }
        },
        render: function render() {
            return this.props.children;
        }
    });
    var Consumer = miniCreateClass(function Consumer() {
        instance.subscribers.push(this);
        this.observedBits = 0;
        this.state = {
            value: instance.value
        };
    }, Component, {
        componentWillUnmount: function componentWillUnmount() {
            var i = instance.subscribers.indexOf(this);
            instance.subscribers.splice(i, 1);
        },
        render: function render() {
            return this.props.children(this.state.value);
        }
    });
    function getContext(fiber){
        while (fiber.return){
            if (fiber.name == 'Provider'){
                return instance.value;
            }
            fiber = fiber.return;
        }
        return defaultValue;
    }
    getContext.subscribers = [];
    getContext.Provider = Provider;
    getContext.Consumer = Consumer;
    return getContext;
}



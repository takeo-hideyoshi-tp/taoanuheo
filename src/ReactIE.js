import { options, REACT_FRAGMENT_TYPE, hasOwnProperty } from "./util";
import { Children } from "./Children";
import * as eventSystem from "./event";
import { PropTypes } from "./PropTypes";
import { Component } from "./Component";
import { win as window } from "./browser";
import { createClass } from "./createClass";
import { cloneElement } from "./cloneElement";
import { PureComponent } from "./PureComponent";
import { createElement } from "./createElement";
import { createPortal } from "./createPortal";

import { render, findDOMNode, isValidElement, unmountComponentAtNode, unstable_renderSubtreeIntoContainer } from "./diff";

import "./compat";
function needFix(fn) {
    return !/native code/.test(fn);
}
function keysPolyfill() {
    //解决IE下Object.keys的性能问题
    if (needFix(Object.keys)) {
        Object.keys = function keys(obj) {
            var a = [];
            for (var k in obj) {
                if (hasOwnProperty.call(obj, k)) {
                    a.push(k);
                }
            }
            return a;
        };
    }
}
keysPolyfill();
setTimeout(keysPolyfill, 0);
setTimeout(keysPolyfill, 100);

var React;
if (window.React && window.React.options) {
    React = window.React;
} else {
    React = window.React = window.ReactDOM = {
        version: "VERSION",
        render,
        hydrate: render,
        Fragment: REACT_FRAGMENT_TYPE,
        options,
        PropTypes,
        Children,
        Component,
        eventSystem,
        findDOMNode,
        createClass,
        createPortal,
        createElement,
        cloneElement,
        PureComponent,
        isValidElement,
        unmountComponentAtNode,
        unstable_renderSubtreeIntoContainer,

        createFactory(type) {
            console.warn("createFactory is deprecated"); // eslint-disable-line
            var factory = createElement.bind(null, type);
            factory.type = type;
            return factory;
        }
    };
}
export default React;

import { Component } from "./Component";
import { options, REACT_FRAGMENT_TYPE } from "./util";
import { Children } from "./Children";
import { win as window } from "./browser";
import { createElement } from "./createElement";
import { cloneElement } from "./cloneElement";
import { PureComponent } from "./PureComponent";
import { createPortal } from "./createPortal";

import { render, findDOMNode, unmountComponentAtNode } from "./diff";


var React;
if (window.React && window.React.options) {
    React = window.React;
} else {
    React = window.React = window.ReactDOM =  {
        version: "VERSION",
        render,
        hydrate: render,
        Fragment: REACT_FRAGMENT_TYPE,
        options,
        Children, 
        Component,
        findDOMNode,
        createPortal,
        createElement,
        cloneElement,
        PureComponent,
        unmountComponentAtNode
    };
}
export default React;

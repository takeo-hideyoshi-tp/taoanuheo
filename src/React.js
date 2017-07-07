import { createElement } from "./createElement";
import { cloneElement } from "./cloneElement";

import { PureComponent } from "./PureComponent";
import { Component } from "./Component";
import { Children } from "./Children";
import { win as window } from "./browser";
import * as eventSystem from "./event";
import { createClass } from "./createClass";

import { options } from "./util";
import { PropTypes } from "./PropTypes";

import {
  render,
  findDOMNode,
  unstable_renderSubtreeIntoContainer,
  isValidElement
} from "./diff";

var React = {
  PropTypes,
  Children, //为了react-redux
  render,
  findDOMNode,
  options,
  unstable_renderSubtreeIntoContainer,
  isValidElement,
  createClass,
  version: "VERSION",
  createElement,
  cloneElement,
  PureComponent,
  Component,
  eventSystem
};

window.ReactDOM = React;

export default React;

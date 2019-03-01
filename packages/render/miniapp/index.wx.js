import { Children } from 'react-core/Children';
import { PropTypes } from 'react-core/PropTypes';
import { Component } from 'react-core/Component';
import { PureComponent } from 'react-core/PureComponent';
import { createPortal } from 'react-core/createPortal';
import {
    createElement,
    cloneElement,
    isValidElement,
    createFactory
} from 'react-core/createElement';
import { createContext } from 'react-core/createContext';
import { Fragment, getWindow, miniCreateClass } from 'react-core/util';
//注入小程序的API
import { registerAPIs } from './registerAPIs';

import { dispatchEvent, webview } from './eventSystem';

import { Renderer } from './render.all';

import { toStyle } from './toStyle';
import { toRenderProps, _getApp, getCurrentPage, _getCurrentPages, useComponent } from './utils';
import { registerPage } from './registerPage.wx';
import { registerComponent } from './registerComponent.wx';


let { render } = Renderer;

let React = getWindow().React =  {
    //平台相关API
    eventSystem: {
        dispatchEvent
    },

    findDOMNode: function() {
        console.log('小程序不支持findDOMNode'); /* eslint-disable-line */
    },
    //fiber底层API
    render: render,
    hydrate: render,
    webview,
    Fragment,
    PropTypes,
    Children,
    Component,
    createPortal,
    createElement,
    createFactory,
    cloneElement,
    PureComponent,
    isValidElement,
    createContext,
    toClass: miniCreateClass,
    toRenderProps,
    useComponent,
    registerComponent,
    getCurrentPage,
    getCurrentPages: _getCurrentPages,
    getApp: _getApp,
    registerPage,
    toStyle,
    appType: 'wx'
};
let apiContainer = {};
if (typeof wx != 'undefined'){
    apiContainer = wx;//eslint-disable-line
} else if (typeof tt != 'undefined'){
    apiContainer = tt;//eslint-disable-line
    React.appType = 'tt';
} 

registerAPIs(React, apiContainer);

export default React;
export { Children, createElement, Component };

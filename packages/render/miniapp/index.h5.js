import { Children } from 'react-core/Children';
import { PropTypes } from 'react-core/PropTypes';
import { Component } from 'react-core/Component';
import { PureComponent } from 'react-core/PureComponent';
import { createRef, forwardRef } from 'react-core/createRef';
import {
    createElement,
    cloneElement,
    isValidElement,
    createFactory
} from 'react-core/createElement';

import { createContext } from 'react-core/createContext';

import { Fragment, getWindow, miniCreateClass } from 'react-core/util';


//import { dispatchEvent, webview } from './eventSystem';
import { DOMRenderer} from '../dom/DOMRenderer';


// import { toStyle } from './toStyle';
import { 
    _getApp , 
    getCurrentPage, 
    useComponent } from './utils';
//小程序的API注入
import { registerAPIs } from './registerAPIs';
import { more } from './apiForH5/index';

import { registerComponent } from './registerComponent.bu';
// import { registerPage } from './registerPage.wx';
import { 
    useState,
    useReducer, 
    useCallback,
    useMemo,
    useEffect, 
    useContext } from 'react-core/hooks';

let { render, findDOMNode } = DOMRenderer;

let React = (getWindow().React = {
    //平台相关API
  //  eventSystem: {
  //      dispatchEvent
  //  },

    findDOMNode,
    //fiber底层API
    version: 'VERSION',
    render: render,
    hydrate: render,
  //  webview,
    Fragment,
    PropTypes,
    Children,
    Component,
    // createPortal,
    createContext,
    createElement,
    createFactory,
    // cloneElement,
    PureComponent,
    isValidElement,

    toClass: miniCreateClass,
    
    registerComponent,
    getCurrentPage: function() {
        return this.__currentPages[this.__currentPages.length - 1];
    },
    getCurrentPages: function() {
        return this.__currentPages;
    },
    getApp: function() {
        return this.__app;
    },
    // registerPage,
    registerApp: function(app){
        this.__app = app;
    },
    registerPage: function(PageClass, path) {
        this.__pages[path] = PageClass;
        return PageClass;
    },
    // toStyle,
    useState,
    useReducer, 
    useCallback,
    useMemo,
    useEffect, 
    useContext,
    useComponent,
    createRef,
    cloneElement,
    appType: 'h5',
    __app: {},
    __pages: {},
    __currentPages: []
});
let apiContainer = {
    redirectTo: function(options) {
        if (React.__currentPages.length > 0) {
            React.__currentPages.pop();
        }
        this.navigateTo.call(this, options);
    },
    navigateTo: function({url, success, fail, complete}) {
        var [path, query] = getQuery(url);
        React.__currentPages.push(path);
        var appInstance = React.__app;
        var appConfig = appInstance.constructor.config;
        if (appConfig.pages.indexOf(path) === -1){
            throw "没有注册该页面: "+ path;
        }
        appInstance.setState({
            path,
            query, 
            success, 
            fail, 
            complete
        });
    },
    navigateBack: function({delta = 1, success, fail, complete} = {}) {
        var path;
        while (delta && React.__currentPages.length) {
            path = React.__currentPages.pop();
            delta--;
        }
        path = React.__currentPages[React.__currentPages.length - 1];
        var appInstance = React.__app;
        appInstance.setState({
            path,
            success, 
            fail, 
            complete
        });
    },
    switchTab: function({url, success, fail, complete}) {
        var [path, query] = getQuery(url);
        var config = React.__app.constructor.config;
        if (config && config.tabBar && config.tabBar.list) {
            if (config.tabBar.list.length < 2 || config.tabBar.list.length > 5) {
                console.warn('tabBar数量非法，必须大于2且小于5个');
                return;
            }
            if (config.tabBar.list.every(item => item.pagePath !== path.replace(/^\//, ''))) {
                console.warn(`${path}未在tabBar.list中定义!`);
                return;
            }
            React.__currentPages = [];
            this.navigateTo.call(this, {url, success, fail, complete});
        }
    }
};
function getQuery(url) {
    return url.split('?');
}

registerAPIs(React, apiContainer, more);

export default React;

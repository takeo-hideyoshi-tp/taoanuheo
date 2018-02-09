import { options, innerHTML, noop, inherit, toLowerCase, emptyArray, toArray, deprecatedWarn } from "./util";
import { createElement as createDOMElement, emptyElement, insertElement, document } from "./browser";
import { disposeVnode, disposeChildren, topFibers, topNodes } from "./dispose";
import { createVnode, fiberizeChildren, createElement } from "./createElement";
import { ComponentFiber, getContextByTypes, getDerivedStateFromProps } from "./ComponentFiber";
import { Component } from "./Component";
import { HostFiber } from "./HostFiber";
import { drainQueue } from "./scheduler";
import { Refs } from "./Refs";
import { captureError } from "./ErrorBoundary";

//[Top API] React.isValidElement
export function isValidElement(vnode) {
    return vnode && vnode.vtype;
}

//[Top API] ReactDOM.render
export function render(vnode, container, callback) {
    return renderByAnu(vnode, container, callback);
}
//[Top API] ReactDOM.unstable_renderSubtreeIntoContainer
export function unstable_renderSubtreeIntoContainer(lastVnode, nextVnode, container, callback) {
    deprecatedWarn("unstable_renderSubtreeIntoContainer");
    var updater = lastVnode && lastVnode.updater;
    var parentContext = updater ? updater.parentContext : {};
    return renderByAnu(nextVnode, container, callback, parentContext);
}
//[Top API] ReactDOM.unmountComponentAtNode
export function unmountComponentAtNode(container) {
    let nodeIndex = topNodes.indexOf(container);
    if (nodeIndex > -1) {
        var lastFiber = topFibers[nodeIndex];
        var queue = [];
        disposeVnode(lastFiber, queue);
        drainQueue(queue);
        emptyElement(container);
        container.__component = null;
        return true;
    }
    return false;
}
//[Top API] ReactDOM.findDOMNode
export function findDOMNode(componentOrElement) {
    if (componentOrElement == null) {
        //如果是null
        return null;
    }
    if (componentOrElement.nodeType ) {
        //如果本身是元素节点
        return componentOrElement;
    }
    //实例必然拥有updater与render
    if (componentOrElement.render) {
        var vnode = componentOrElement.updater._reactInternalFiber;
        var c = vnode.child;
        if(c){
            return findDOMNode(c.stateNode);
        }else{
            return null;
        }
    }
}

var AnuWrapper = function() {
    Component.call(this);
};
var fn = inherit(AnuWrapper, Component);

fn.render = function() {
    return this.props.child;
};

// ReactDOM.render的内部实现 Host
function renderByAnu(vnode, root, callback, context = {}) {
    if (!(root && root.appendChild)) {
        throw `ReactDOM.render的第二个参数错误`; // eslint-disable-line
    }
    //__component用来标识这个真实DOM是ReactDOM.render的容器，通过它可以取得上一次的虚拟DOM
    // 但是在IE6－8中，文本/注释节点不能通过添加自定义属性来引用虚拟DOM，这时我们额外引进topFibers,
    //topNodes来寻找它们。
    let nodeIndex = topNodes.indexOf(root),
        wrapperFiber,
        updateQueue = [],
        insertCarrier = {};
    //updaterQueue是用来装载updater， insertCarrier是用来装载插入DOM树的真实DOM
    if (nodeIndex !== -1) {
        wrapperFiber = topFibers[nodeIndex];
        if (wrapperFiber._hydrating) {
            //如果是在componentDidMount/Update中使用了ReactDOM.render，那么将延迟到此组件的resolve阶段执行
            wrapperFiber._pendingCallbacks.push(renderByAnu.bind(null, vnode, root, callback, context));
            return wrapperFiber.child.stateNode; //这里要改
        }
    } else {
        topNodes.push(root);
        nodeIndex = topNodes.length - 1;
    }
    Refs.currentOwner = null; //防止干扰
    var cbVnode = createElement(AnuWrapper, { child: vnode });
    if (wrapperFiber) {
        receiveVnode(wrapperFiber, cbVnode, context, updateQueue, insertCarrier);
    } else {
        var rootVnode = createVnode(root);
        var rootFiber = new HostFiber(rootVnode);
        rootFiber.stateNode = root;
        rootFiber.context = context;
        emptyElement(root);
        var children = rootFiber.children = {
            ".0": cbVnode
        };
        mountChildren(children, rootFiber, updateQueue, insertCarrier);
    }
    rootFiber.init(updateQueue); // 添加最顶层的updater
    wrapperFiber = rootFiber.child;
    topFibers[nodeIndex] = wrapperFiber;
    wrapperFiber.isTop = true;
    root.__component = wrapperFiber; //兼容旧的
    if (callback) {
        wrapperFiber._pendingCallbacks.push(callback.bind(wrapperFiber.child.stateNode));
    }
    drainQueue(updateQueue);
    //组件返回组件实例，而普通虚拟DOM 返回元素节点
    return wrapperFiber.child.stateNode;
}


/**
 * 
 * @param {Vnode} vnode 
 * @param {Fiber} parentFiber 
 * @param {Array} updateQueue 
 * @param {Object} insertCarrier 
 */
function mountVnode(vnode, parentFiber, updateQueue, insertCarrier) {
    options.beforeInsert(vnode);
    var fiber;
    if (vnode.tag > 4) {
        fiber = new HostFiber(vnode, parentFiber);
        fiber.stateNode = createDOMElement(vnode, parentFiber);
        var beforeDOM = insertCarrier.dom;
        insertCarrier.dom = fiber.stateNode;
        if(fiber.tag === 5){
            let children = fiberizeChildren(vnode.props.children, fiber);
            mountChildren(children, fiber, updateQueue, {});
            fiber.init(updateQueue);
        }
        insertElement(fiber, beforeDOM);
        if(fiber.tag === 5){
            fiber.attr();
        }
    } else {
        fiber = new ComponentFiber(vnode, parentFiber);
        fiber.init(updateQueue, insertCarrier);
    }
    return fiber;
}
/**
 * 重写children对象中的vnode为fiber，并用child, sibling, return关联各个fiber
 * @param {Object} children 
 * @param {Fiber} parentFiber 
 * @param {Array} updateQueue 
 * @param {Object} insertCarrier 
 */
function mountChildren(children, parentFiber, updateQueue, insertCarrier) {
    var prevFiber, firstFiber, index = 0;
    for (var i in children) {
        var child = children[i];
        var fiber = children[i] = mountVnode(child, parentFiber, updateQueue, insertCarrier);
        fiber.index = index++;
        if(!firstFiber){
            parentFiber.child = firstFiber = fiber;
        }
        if(prevFiber){
            prevFiber.sibling = fiber;
        }
        prevFiber = fiber;
        if (Refs.errorHook) {
            break;
        }
    }
}

function updateVnode(lastVnode, nextVnode, context, updateQueue, insertCarrier) {
    var dom = (nextVnode.stateNode = lastVnode.stateNode);
    options.beforeUpdate(nextVnode);
    if (lastVnode.tag > 4) {
        insertElement(nextVnode, insertCarrier.dom);
        insertCarrier.dom = dom;
        if (lastVnode.tag === 6) {
            if (nextVnode.text !== lastVnode.text) {
                dom.nodeValue = nextVnode.text;
            }
        } else {
            if (lastVnode.namespaceURI) {
                nextVnode.namespaceURI = lastVnode.namespaceURI;
            }
            let updater = (nextVnode.updater = lastVnode.updater);
            updater._reactInternalFiber = nextVnode;
            nextVnode.lastProps = lastVnode.props;
            let lastChildren = updater.children;
            let { props } = nextVnode;
            if (props[innerHTML]) {
                disposeChildren(lastChildren, updateQueue);
            } else {
                var nextChildren = fiberizeChildren(props.children, updater);
                diffChildren(lastChildren, nextChildren, nextVnode, context, updateQueue, {});
            }
            updater.attr();
            updater.addState("resolve");
            updateQueue.push(updater);
        }
    } else {
        receiveComponent(lastVnode, nextVnode, context, updateQueue, insertCarrier);
    }
}

function receiveComponent(lastVnode, nextVnode, parentContext, updateQueue, insertCarrier) {
    // todo:减少数据的接收次数
    let { type, stateNode } = lastVnode,
        updater = stateNode.updater,
        nextProps = nextVnode.props,
        willReceive = lastVnode !== nextVnode,
        nextContext;
    if (!type.contextTypes) {
        nextContext = stateNode.context;
    } else {
        nextContext = getContextByTypes(parentContext, type.contextTypes);
        willReceive = true;
    }
   
    updater.props = nextProps;
    if (updater.isPortal) {
        updater.insertCarrier = {};
    } else {
        updater.insertCarrier = insertCarrier;
    }
    updater.parentContext = parentContext;
    updater.pendingVnode = nextVnode;
    updater.context = nextContext;
    updater.willReceive = willReceive;
    nextVnode.stateNode = stateNode;
    if (!updater._dirty) {
        updater._receiving = true;
        updater.updateQueue = updateQueue;
        if(willReceive){
            captureError(stateNode, "componentWillReceiveProps", [nextProps, nextContext]);
        }
        if(lastVnode.props !== nextProps){
            getDerivedStateFromProps(updater, type, nextProps, stateNode.state);
        }
        if (updater._hasError) {
            return;
        }
        delete updater._receiving;
        if (lastVnode.ref !== nextVnode.ref) {
            Refs.fireRef(lastVnode, null);
        }
        updater.hydrate(updateQueue, true);
    }
}

function isSameNode(a, b) {
    if (a.type === b.type && a.key === b.key) {
        return true;
    }
}

function receiveVnode(lastVnode, nextVnode, context, updateQueue, insertCarrier) {
    if (isSameNode(lastVnode, nextVnode)) {
        //组件虚拟DOM已经在diffChildren生成并插入DOM树
        updateVnode(lastVnode, nextVnode, context, updateQueue, insertCarrier);
    } else {
        disposeVnode(lastVnode, updateQueue);
        mountVnode(nextVnode, context, updateQueue, insertCarrier);
    }
}
// https://github.com/onmyway133/DeepDiff
function diffChildren(lastChildren, nextChildren, parentFiber, parentContext, updateQueue, insertCarrier) {
    //这里都是走新的任务列队
    let lastChild,
        nextChild,
        isEmpty = true,
        child,
        firstChild;
    if (parentFiber.tag === 5) {
        firstChild = parentFiber.stateNode.firstChild;
    }
    for (var i in lastChildren) {
        isEmpty = false;
        child = lastChildren[i];
        //向下找到其第一个元素节点子孙
        if (firstChild) {
            do {
                if (child.superReturn) {
                    break;
                }
                if (child.tag > 4 ) {
                    child.stateNode = firstChild;
                    break;
                }
            } while ((child = child.child));
        }
        break;
    }

    //优化： 只添加
    if (isEmpty) {
        mountChildren(nextChildren, parentFiber, updateQueue, insertCarrier);
    } else {
        var matchNodes = {},
            matchRefs = [];
        for (let i in lastChildren) {
            nextChild = nextChildren[i];
            lastChild = lastChildren[i];
            if (nextChild && nextChild.type === lastChild.type) {
                matchNodes[i] = lastChild;
                if (lastChild.tag > 4 && lastChild.ref !== nextChild.ref) {
                    lastChild.order = nextChild.index;
                    matchRefs.push(lastChild);
                }
                continue;
            }
            disposeVnode(lastChild, updateQueue);
        }
        //step2: 更新或新增节点
        matchRefs
            .sort(function(a, b) {
                return a.order - b.order;
            })
            .forEach(function(el) {
                updateQueue.push({
                    transition: Refs.fireRef.bind(null, el, null),
                    isMounted: noop
                });
            });
        for (let i in nextChildren) {
            nextChild = nextChildren[i];
            lastChild = matchNodes[i];
            if (lastChild) {
                receiveVnode(lastChild, nextChild, parentContext, updateQueue, insertCarrier);
            } else {
                mountVnode(nextChild, parentContext, updateQueue, insertCarrier);
            }

            if (Refs.errorHook) {
                return;
            }
        }
    }
}

Refs.diffChildren = diffChildren;

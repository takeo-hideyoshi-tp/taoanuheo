import {
    getContext,
    getInstances,
    getComponentName,
    matchInstance,
    getTop,
    midway,
    extend
} from './util'
import {
    applyComponentHook
} from './lifecycle'

import {
    transaction
} from './transaction'
import {
    toVnode
} from './toVnode'
import {
    diffProps
} from './diffProps'
import {
    document,
    createDOMElement
} from './browser'
import {
    removeRef
} from './ref'
import {
    setControlledComponent
} from './ControlledComponent'
// createElement创建的虚拟DOM叫baseVnode
/**
 * 渲染组件
 *
 * @param {any} instance
 */
export function updateComponent(instance) {
    var {
        props,
        state,
        context,
        prevProps
    } = instance
    var oldRendered = instance._rendered
    var baseVnode = instance.getBaseVnode()
    var hostParent = baseVnode._hostParent

    if (instance._unmount) {
        return baseVnode._hostNode //注意
    }
    var nextProps = props
    prevProps = prevProps || props
    var nextState = instance._processPendingState(props, context)

    instance.props = prevProps
    delete instance.prevProps

    if (!instance._forceUpdate && applyComponentHook(instance, 4, nextProps, nextState, context) === false) {
        return baseVnode._hostNode //注意
    }
    applyComponentHook(instance, 5, nextProps, nextState, context)
    instance.props = nextProps
    instance.state = nextState
    delete instance._updateBatchNumber

    var rendered = transaction.renderWithoutSetState(instance, nextProps, context)
    //context只能孩子用，因此不要影响原instance.context
    context = getContext(instance, context)
console.log(context, 'context')
    instance._rendered = rendered
    //rendered的type为函数时，会多次进入toVnode
    var dom = diff(rendered, oldRendered, hostParent, context, baseVnode._hostNode)
    baseVnode._hostNode = dom
    applyComponentHook(instance, 6, nextProps, nextState, context)

    return dom //注意
}
/**
 * call componentWillUnmount
 *
 * @param {any} vnode
 */
function removeComponent(vnode) {

    var instance = vnode._instance

    applyComponentHook(instance, 7) //componentWillUnmount hook

    '_hostNode,_hostParent,_instance,_wrapperState,_owner'.replace(/\w+/g, function (name) {
        vnode[name] = NaN
    })
    var props = vnode.props
    if (props) {
        removeRef(instance, props.ref)
        props
            .children
            .forEach(function (el) {
                removeComponent(el)
            })
    }

}

/**
 * 参数不要出现DOM,以便在后端也能运行
 *
 * @param {VNode} vnode 新的虚拟DOM
 * @param {VNode} prevVnode 旧的虚拟DOM
 * @param {VNode} hostParent 父虚拟DOM
 * @param {Object} context
 * @param {DOM} prevNode
 * @returns
 */
export function diff(vnode, prevVnode, hostParent, context, prevNode) { //updateComponent
    var prevInstance = prevVnode._instance
    var parentInstance = prevInstance && prevInstance.parentInstance
    var parentNode = hostParent._hostNode

    var prevProps = prevVnode.props || {}
    var prevChildren = prevProps.children || []

    var Type = vnode.type
    var isComponent = typeof Type === 'function'

    var baseVnode = vnode
    var hostNode = prevVnode._hostNode
    var instance = vnode._instance
    if (prevInstance) {
        baseVnode = prevInstance.getBaseVnode()
        hostNode = baseVnode._hostNode
        if (instance !== prevInstance) {
            instance = isComponent && matchInstance(prevInstance, Type)
        }
       
        if (instance) { //如果类型相同，使用旧的实例进行 render新的虚拟DOM
            vnode._instance = instance
            console.log('xxxxxxxx更新context')
            instance.context = context //更新context
            instance.prevProps = prevProps
            var nextProps = vnode.props
            //处理非状态组件
            if (instance.statelessRender) {
                instance.props = nextProps
                return updateComponent(instance, context)
            }
            applyComponentHook(instance, 3, nextProps) //componentWillReceiveProps

            instance.props = nextProps

            return updateComponent(instance, context)
        } else {
            var remove = true
            removeComponent(prevVnode)

        }
    }
    if (isComponent) {
        try {
            return toDOM(vnode, context, hostParent, prevNode, parentInstance)
        } finally {
            if (remove && hostNode === prevNode) {
                parentNode.removeChild(hostNode)
            }
        }
    } else if (!hostNode || prevVnode.type !== Type) {
        //如果元素类型不一致
        var nextNode = createDOMElement(vnode)
        parentNode.insertBefore(nextNode, hostNode || null)
        prevChildren = []
        prevProps = {}
        if (prevNode) {
            parentNode.removeChild(prevNode)
        }
        removeComponent(prevVnode)
        hostNode = nextNode
    } else {
        console.log('类型相等', vnode.type)
    }

    //必须在diffProps前添加它的真实节点

    baseVnode._hostNode = hostNode
    baseVnode._hostParent = hostParent

    if (prevProps.dangerouslySetInnerHTML) {
        while (hostNode.firstChild) {
            hostNode.removeChild(hostNode.firstChild)
        }
    }
    var props = vnode.props
    if (props) {
        if (!props.angerouslySetInnerHTML) {
            diffChildren(props.children, prevChildren, vnode, context)
        }
        diffProps(props, prevProps, vnode, prevVnode)
    }

    var wrapperState = vnode._wrapperState
    if (wrapperState && wrapperState.postUpdate) { //处理select
        wrapperState.postUpdate(vnode)
    }
    return hostNode
}

/**
 *
 *
 * @param {any} type
 * @param {any} vnode
 * @returns
 */
function computeUUID(type, vnode) {
    if (type === '#text') {
        return type + '/' + vnode.deep + '/' + vnode.text
    }

    return type + '/' + vnode.deep + (vnode.key ?  '/' + vnode.key :'')
}

/**
 *
 *
 * @param {any} newChildren
 * @param {any} oldChildren
 * @param {any} hostParent
 * @param {any} context
 */
function diffChildren(newChildren, oldChildren, hostParent, context) {
    //第一步，根据实例的类型，nodeName, nodeValue, key与数组深度 构建hash
    var mapping = {};
    var str1 = ''
    var nodes = []
    for (let i = 0, n = oldChildren.length; i < n; i++) {
        let vnode = oldChildren[i]
        if (vnode._hostNode) {
            nodes.push(vnode._hostNode)
        }
       

        let uuid = computeUUID(getComponentName(vnode.type) , vnode)
        str1 += uuid + ' '
        if (mapping[uuid]) {
            mapping[uuid].push(vnode)
        } else {
            mapping[uuid] = [vnode]
        }
    }

    //第二步，遍历新children, 从hash中取出旧节点
     //console.log('旧的', str1)
    var removedChildren = oldChildren.concat();
    str1 = ''
    for (let i = 0, n = newChildren.length; i < n; i++) {
        let vnode = newChildren[i];
        let tag = getComponentName(vnode.type, vnode._hasInstance = 1) 
        let uuid = computeUUID(tag, vnode)
        str1 += uuid + ' '
        if (mapping[uuid]) {
            var matchNode = mapping[uuid].shift()

            if (!mapping[uuid].length) {
                delete mapping[uuid]
            }
            if (matchNode) {
                let index = removedChildren.indexOf(matchNode)
                if (index !== -1) {
                    removedChildren.splice(index, 1)
                    vnode.prevVnode = matchNode //重点
                }
            }
        }
    }
    //  console.log('新的', str1, nodes)

    var parentNode = hostParent._hostNode,
        //第三，逐一比较
        branch;
   
    for (var i = 0, n = newChildren.length; i < n; i++) {
        let vnode = newChildren[i],
            prevVnode = null,
            prevNode = nodes[i]
        if (vnode.prevVnode) {
            prevVnode = vnode.prevVnode
        } else {
            if (removedChildren.length) {
                prevVnode = removedChildren.shift()
            }
        }

        vnode._hostParent = hostParent
        if (prevVnode) { //假设两者都存在
            let isTextOrComment = 'text' in vnode
            let prevDom = prevVnode._hostNode
            var prevInstance = prevVnode._instance
            delete vnode.prevVnode
            if (vnode._hasInstance) { //都是同种组件

                delete vnode._hasInstance
              //  delete prevVnode._instance._unmount
              //  var inst = vnode._instance = prevInstance
                vnode._hostNode = diff(vnode, prevVnode, hostParent, context, prevDom)
                branch = 'A'
            } else if (vnode.type === prevVnode.type) { //都是元素，文本或注释

                if (isTextOrComment) {
                    vnode._hostNode = prevDom

                    if (vnode.text !== prevVnode.text) {
                        vnode._hostNode.nodeValue = vnode.text
                    }
                    branch = 'B'
                } else {
                    // console.log(vnode.type, '看一下是否input')
                    vnode._hostNode = diff(vnode, prevVnode, hostParent, context, prevDom)
                    branch = 'C'
                }
            } else if (isTextOrComment) { //由其他类型变成文本或注释

                vnode._hostNode = createDOMElement(vnode)
                branch = 'D'

                removeComponent(prevVnode) //移除元素节点或组件}
            } else { //由其他类型变成元素

                vnode._hostNode = diff(vnode, prevVnode, hostParent, context, prevDom)

                branch = 'E'
            }
            //当这个孩子是上级祖先传下来的，那么它是相等的
            if (vnode !== prevVnode) {
                delete prevVnode._hostNode //clear reference
            }

        } else { //添加新节点
            if (!vnode._hostNode) {
                /* istanbul ignore next */
                vnode._hostNode = toDOM(vnode, context, hostParent, prevNode, prevInstance)
                branch = 'F'
            }
        }
        // console.log('branch  ', branch)
        //  if (nativeChildren[i] !== vnode._hostNode) {
        //      parentNode.insertBefore(vnode._hostNode, nativeChildren[i] || null)
        //  }
    }
    //  while (nativeChildren[i]) {
    //       parentNode.removeChild(nativeChildren[i])
    //   }

    //第4步，移除无用节点
    if (removedChildren.length) {
        for (let i = 0, n = removedChildren.length; i < n; i++) {
            let vnode = removedChildren[i]
            var dom = vnode._hostNode
            if (dom.parentNode) {
                vnode.isRemove = true
                dom
                    .parentNode
                    .removeChild(dom)
            }
            if (vnode._instance) {
                removeComponent(vnode)
            }

        }
    }

}
// React.createElement返回的是用于定义数据描述结果的虚拟DOM 如果这种虚拟DOM的type为一个函数或类，那么将产生组件实例
// renderedComponent 组件实例通过render方法更下一级的虚拟DOM renderedElement
/**
 *
 * @export
 * @param {VNode} vnode
 * @param {DOM} context
 * @param {DOM} parentNode ?
 * @param {DOM} replaced ?
 * @returns
 */
export function toDOM(vnode, context, hostParent, prevNode, parentIntance) {
    //如果一个虚拟DOM的type为字符串 或 它拥有instance，且这个instance不再存在parentInstance, 那么它就可以拥有_dom属性
    vnode = toVnode(vnode, context, parentIntance)
    var hostNode = createDOMElement(vnode)
    var props = vnode.props
    var parentNode = hostParent._hostNode
    var instance = vnode._instance || vnode._owner
    var canComponentDidMount = instance && !vnode._hostNode
    //每个实例保存其虚拟DOM 最开始的虚拟DOM保存instance

    if (typeof vnode.type === 'string') {
        vnode._hostNode = hostNode
        vnode._hostParent = hostParent
    }
    if (instance) {
        var baseVnode = instance.getBaseVnode()
        if (!baseVnode._hostNode) {
            baseVnode._hostNode = hostNode
            baseVnode._hostParent = hostParent
        }
    }
    if (vnode.context) {
        context = vnode.context
        delete vnode.context
    }
    //文本是没有instance, 只有empty与元素节点有instance

    if (parentNode) {
        parentNode.insertBefore(hostNode, prevNode || null)
    }
    //只有元素与组件才有props
    if (props && !props.dangerouslySetInnerHTML) {
        // 先diff Children 再 diff Props 最后是 diff ref
        diffChildren(props.children, [], vnode, context) //添加第4参数
    }
    //尝试插入DOM树
    if (parentNode) {
        var instances
        if (canComponentDidMount) { //判定能否调用componentDidMount方法
            instances = getInstances(instance)
        }
        if (props) {

            diffProps(props, {}, vnode, {})
            setControlledComponent(vnode)
        }
        if (instances) {

            while (instance = instances.shift()) {
                applyComponentHook(instance, 2)
            }
        }
    }

    return hostNode
}
//将Component中这个东西移动这里
midway.immune.updateComponent = function updateComponentProxy(instance) { //这里触发视图更新

    updateComponent(instance)
    instance._forceUpdate = false
}
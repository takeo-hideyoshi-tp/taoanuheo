(function (global, factory) {
     typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
     typeof define === 'function' && define.amd ? define(factory) :
     (global.React = factory());
}(this, function () {

     var CurrentOwner = {
         cur: null
     }

     var queue = []
      var callbacks = []

      function setState() {
          if (transaction.isInTransation) {
              console.warn("Cannot update during an existing state transition (such as within `render` or another component's constructor). " +
                  "Render methods should be a pure function of props and state; constructor side-effects are an anti-pattern," +
                  " but can be moved to `componentWillMount`")
          }
      }


      var transaction = {
          isInTransation: false,
          enqueueCallback: function(obj) {
              //它们是保证在ComponentDidUpdate后执行
              callbacks.push(obj)
          },
          renderWithoutSetState: function(instance) {
              instance.setState = instance.forceUpdate = setState
              try {
                  CurrentOwner.cur = instance
                  var vnode = instance.render()
                  if (vnode === null) {
                      vnode = {
                          type: '#comment',
                          text: 'empty'
                      }
                  }
              } finally {
                  CurrentOwner.cur = null
                  delete instance.setState
                  delete instance.forceUpdate
              }
              return vnode
          },
          enqueue: function(obj) {
              if (obj)
                  queue.push(obj)
              if (!this.isInTransation) {
                  this.isInTransation = true
                  var preProcessing = queue.concat()
                  var processingCallbacks = callbacks.concat()
                  var mainProcessing = []
                  queue.length = callbacks.length = 0
                  var unique = {}
                  preProcessing.forEach(function(request) {
                      try {
                          request.init() //预处理， 合并参数，同一个组件的请求只需某一个进入主调度程序
                          if (!unique[request.component.uuid]) {
                              unique[request.component.uuid] = 1
                              mainProcessing.push(request)
                          }
                      } catch (e) {
                          console.log(e)
                      }

                  })

                  mainProcessing.forEach(function(request) {
                      try {
                          request.exec() //执行主程序
                      } catch (e) {
                          console.log(e)
                      }
                  })
                  processingCallbacks.forEach(function(request) {
                      request.cb.call(request.instance)
                  })
                  this.isInTransation = false
                  if (queue.length) {
                      this.enqueue() //用于递归调用自身)
                  }
              }
          }
      }

     /**
      * 复制一个对象的属性到另一个对象
      * 
      * @param {any} obj 
      * @param {any} props 
      * @returns 
      */
     function extend(obj, props) {
         if (props) {
             for (let i in props) {
                 obj[i] = props[i]
             }
         }
         return obj
     }
     /**
      * 创建一个对象的浅克隆副本
      * 
      * @param {any} obj 
      * @returns 
      */
     function clone(obj) {
         return extend({}, obj)
     }
     /**
      * 类继承
      * 
      * @export
      * @param {any} SubClass 
      * @param {any} SupClass 
      */
     function inherit(SubClass, SupClass) {
         function Bridge() {}
         Bridge.prototype = SupClass.prototype

         let fn = SubClass.prototype = new Bridge()

         // 避免原型链拉长导致方法查找的性能开销
         extend(fn, SupClass.prototype)
         fn.constructor = SubClass
     }

     /**
      * 判定否为与事件相关
      * 
      * @param {any} name 
      * @returns 
      */
     function isEvent(name) {
         return /^on[A-Z]/.test(name)
     }

     /**
      * 收集该虚拟DOM的所有组件实例，方便依次执行它们的生命周期钩子
      * 
      * @param {any} instance 
      * @returns 
      */
     function getInstances(instance) {
         var instances = [instance]
         while (instance = instance.parentInstance) {
             instances.push(instance)
         }
         return instances
     }
     /**
      * 寻找适合的实例并返回
      * 
      * @param {any} instance 
      * @param {any} Type 
      * @returns 
      */
     function matchInstance(instance, Type) {
         do {
             if (instance.statelessRender === Type)
                 return instance
             if (instance instanceof Type) {
                 return instance
             }
         } while (instance = instance.parentInstance)
     }
     /**
      * 
      * 
      * @param {any} type 
      * @returns 
      */
     function isComponent(type) {
         return typeof type === 'function'
     }

     /**
      * 
      * 
      * @export
      * @param {any} type 
      * @returns 
      */
     function isStateless(type) {
         var fn = type.prototype
         return isComponent(type) && (!fn || !fn.render)
     }

     var rword = /[^, ]+/g

     function oneObject(array, val) {
         if (typeof array === 'string') {
             array = array.match(rword) || []
         }
         var result = {},
             value = val !== void 0 ? val : 1
         for (var i = 0, n = array.length; i < n; i++) {
             result[array[i]] = value
         }
         return result
     }

     var rcamelize = /[-_][^-_]/g
     function camelize(target) {
         //提前判断，提高getStyle等的效率
         if (!target || target.indexOf('-') < 0 && target.indexOf('_') < 0) {
             return target
         }
         //转换为驼峰风格
         return target.replace(rcamelize, function(match) {
             return match.charAt(1).toUpperCase()
         })
     }

     var lifecycle = {
         '-2': 'getDefaultProps',
         '-1': 'getInitialState',
         '0': 'componentWillMount',
         '1': 'render',
         '2': 'componentDidMount',
         '3': 'componentWillReceiveProps',
         '4': 'shouldComponentUpdate',
         '5': 'componentWillUpdate',
         '6': 'componentDidUpdate',
         '7': 'componentWillUnmount'
     }

     /**
      * 
      * 
      * @export
      * @param {Component} instance 
      * @param {number} index 
      * @returns 
      */
     function applyComponentHook(instance, index) {
         if (instance) {
             var method = lifecycle[index]
             if (instance[method]) {
                 return instance[method].apply(instance, [].slice.call(arguments, 2))
             }
         }
     }

     /**
          * 
          * 
          * @param {any} vnode 
          * @param {any} context 
          * @returns 
          */
         function toVnode(vnode, context) {
             var Type = vnode.type
             if (isComponent(Type)) {
                 var props = vnode.props

                 if (!isStateless(Type)) {
                     var defaultProps = Type.defaultProps || applyComponentHook(Type, -2) || {}
                     props = clone(props) //注意，上面传下来的props已经被冻结，无法修改，需要先复制一份
                     for (var i in defaultProps) {
                         if (props[i] === void 666) {
                             props[i] = defaultProps[i]
                         }
                     }
                     var instance = new Type(props, context)
                         //必须在这里添加vnode，因为willComponent里可能进行setState操作
                     instance.vnode = vnode

                     Component.call(instance, props, context) //重点！！
                     applyComponentHook(instance, 0) //willMount

                     var rendered = transaction.renderWithoutSetState(instance)
                 } else { //添加无状态组件的分支
                     rendered = Type(props, context)
                     instance = {
                         statelessRender: Type,
                         context: context
                     }
                 }
                 if (vnode.instance) {
                     instance.parentInstance = vnode.instance
                     vnode.instance.childInstance = instance
                 }


                 instance.prevProps = vnode.props //实例化时prevProps
                 instance.vnode = vnode
                     //压扁组件Vnode为普通Vnode
                 if (rendered == null) {
                     rendered = ''
                 }
                 if (/number|string/.test(typeof rendered)) {
                     rendered = {
                         type: '#text',
                         text: rendered
                     }
                 }
                 var key = vnode.key
                 extend(vnode, rendered)
                 vnode.key = key
                 vnode.instance = instance

                 return toVnode(vnode, context)
             } else {
                 return vnode
             }
         }

     var rnumber = /^-?\d+(\.\d+)?$/
         /**
          * 为元素样子设置样式
          * 
          * @export
          * @param {any} dom 
          * @param {any} oldStyle 
          * @param {any} newStyle 
          */
     function patchStyle(dom, oldStyle, newStyle) {
         if (oldStyle === newStyle) {
             return
         }
         var old = {}
         for (var name in newStyle) {
             var val = newStyle[name]
             if (oldStyle[name] !== val) {
                 name = cssName(name, dom)
                 var type = typeof val
                 if (type === void 666 || type === null) {
                     val = '' //清除样式
                 } else if (rnumber.test(val) && !cssNumber[name]) {
                     val = val + 'px' //添加单位
                 }
                 dom.style[name] = val //应用样式
             }
         }
         // 如果旧样式存在，但新样式已经去掉
         for (var name in oldStyle) {
             if (!(name in newStyle)) {
                 dom.style[name] = '' //清除样式
             }
         }
     }



     var cssNumber = oneObject('animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom')

     var cssMap = oneObject('float', 'cssFloat')

     //var testStyle = document.documentElement.style
     var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']

     /**
      * 转换成当前浏览器可用的样式名
      * 
      * @param {any} name 
      * @returns 
      */
     function cssName(name, dom) {
         if (cssMap[name]) {
             return cssMap[name]
         }
        var host = dom && dom.style || {}
         for (var i = 0, n = prefixes.length; i < n; i++) {
             camelCase = camelize(prefixes[i] + name)
             if (camelCase in host) {
                 return (cssMap[name] = camelCase)
             }
         }
         return null
     }

     var eventMap = {
           mouseover: 'MouseOver',
           mouseout: 'MouseOut',
           mouseleave: 'MouseLeave',
           mouseenter: 'MouseEnter'
       }

       function dispatchEvent(e) {
           e = new SyntheticEvent(e)
           var target = e.target
           var paths = []
           do {
               var events = target.__events
               if (events) {
                   paths.push({
                       dom: target,
                       props: events
                   })
               }
           } while ((target = target.parentNode) && target.nodeType === 1)

           var type = eventMap[e.type] || e.type

           var capitalized = capitalize(type)
           var bubble = 'on' + capitalized
           var captured = 'on' + capitalized + 'Capture'
           transaction.isInTransation = true
           for (var i = paths.length; i--;) { //从上到下
               var path = paths[i]
               var fn = path.props[captured]
               if (typeof fn === 'function') {
                   e.currentTarget = path.dom
                   fn.call(path.dom, e)
                   if (e._stopPropagation) {
                       break
                   }
               }
           }

           for (var i = 0, n = paths.length; i < n; i++) { //从下到上
               var path = paths[i]
               var fn = path.props[bubble]
               if (typeof fn === 'function') {
                   e.currentTarget = path.dom
                   fn.call(path.dom, e)
                   if (e._stopPropagation) {
                       break
                   }
               }
           }
           transaction.isInTransation = false
           transaction.enqueue()
       }

       function capitalize(str) {
           return str.charAt(0).toUpperCase() + str.slice(1)
       }

       var globalEvents = {}
       function addGlobalEventListener(name) {
           if (!globalEvents[name]) {
               globalEvents[name] = true
               document.addEventListener(name, dispatchEvent)
           }
       }

       var eventNameCache$1 = {}
       var ron = /^on/
       var rcapture = /Capture$/
       function getBrowserName(name) {
           var n = eventNameCache$1[name]
           if (n) {
               return n
           }
           return eventNameCache$1[name] = name.replace(ron, '').
           replace(rcapture, '').toLowerCase()
       }


       function SyntheticEvent(event) {
           if (event.originalEvent) {
               return event
           }
           for (var i in event) {
               if (!eventProto[i]) {
                   this[i] = event[i]
               }
           }
           if (!this.target) {
               this.target = event.srcElement
           }
           var target = this.target
           this.fixEvent()
           this.timeStamp = new Date() - 0
           this.originalEvent = event
       }

       var eventProto = SyntheticEvent.prototype = {
           fixEvent: function() {}, //留给以后扩展用
           preventDefault: function() {
               var e = this.originalEvent || {}
               e.returnValue = this.returnValue = false
               if (e.preventDefault) {
                   e.preventDefault()
               }
           },
           stopPropagation: function() {
               var e = this.originalEvent || {}
               e.cancelBubble = this.$$stop = true
               if (e.stopPropagation) {
                   e.stopPropagation()
               }
           },
           stopImmediatePropagation: function() {
               this.stopPropagation()
               this.stopImmediate = true
           },
           toString: function() {
               return '[object Event]'
           }
       }

     /**
        * 渲染组件
        * 
        * @param {any} instance 
        */
       function updateComponent(instance) {
           var {
               props,
               state,
               context,
               vnode,
               prevProps,
               prevState
           } = instance
           prevState = prevState || state
           instance.props = prevProps
           instance.state = prevState
           var nextProps = props
           var nextState = state
           if (!instance.forceUpdate && applyComponentHook(instance, 4, nextProps, nextState, context) === false) {
               return dom //注意
           }
           applyComponentHook(instance, 5, nextProps, nextState, context)
           instance.props = nextProps
           instance.state = nextState

           if (instance.statelessRender) {
               var rendered = instance.statelessRender(nextProps, context)
           } else {
               rendered = transaction.renderWithoutSetState(instance)
           }
           //context只能孩子用，因此不要影响原instance.context
           if (instance.getChildContext) {
               context = extend(clone(context), instance.getChildContext());
           }
           var dom = diff(rendered, instance.vnode, vnode._hostParent, context)
           instance.vnode = rendered
           rendered.dom = dom
           delete instance.prevState //方便下次能更新this.prevState
           instance.prevProps = props // 更新prevProps
           applyComponentHook(instance, 6, nextProps, nextState, context)
           return dom //注意
       }
       /**
        * call componentWillUnmount
        * 
        * @param {any} vnode 
        */
       function removeComponent(vnode) {
           var instance = vnode.instance

           applyComponentHook(instance, 7) //7
           vnode._hostParent = vnode._hostInfo = vnode.instance = void 666

           var ref = vnode.props.ref
           if (typeof ref === 'string') {
               var o = vnode._owner
               o && (o.refs[ref] = null)
           }

           vnode.props.children.forEach(function (el) {
               if (el.props) {
                   removeComponent(el)
               }
           })
       }


       /**
        * 参数不要出现DOM,以便在后端也能运行
        * 
        * @param {any} vnode 新的虚拟DOM
        * @param {any} prevVnode 旧的虚拟DOM
        * @param {any} vParentNode 父虚拟DOM
        * @param {any} context 
        * @returns 
        */
       function diff(vnode, prevVnode, vParentNode, context) { //updateComponent
           var dom = prevVnode.dom
           var parentNode = vParentNode && vParentNode.dom
           var prevProps = prevVnode.props　 || {}
           var prevChildren = prevProps.children || []
           var Type = vnode.type

           //更新组件
           var isComponent = typeof Type === 'function'
           var instance = prevVnode.instance

           if (instance) {
               instance = isComponent && matchInstance(instance, Type)
               if (instance) { //如果类型相同，使用旧的实例进行 render新的虚拟DOM
                   vnode.instance = instance
                   var nextProps = vnode.props
                   //处理非状态组件
                   if (instance.statelessRender) {
                       instance.props = nextProps
                       instance.prevProps = prevProps
                       return updateComponent(instance, context)
                   }

                   prevProps = instance.prevProps

                   instance.props = prevProps
                   applyComponentHook(instance, 3, nextProps)
                   instance.prevProps = prevProps
                   instance.props = nextProps
                   return updateComponent(instance, context)
               } else {
                   if (prevVnode.type !== Type) {
                       removeComponent(prevVnode)
                   }
               }
           }
           if (isComponent) {
               vnode._hostParent = vParentNode
               return toDOM(vnode, context, parentNode, prevVnode.dom)
           }
           if (!dom || prevVnode.type !== Type) { //这里只能是element 与#text
               var nextDom = document.createElement(Type)
               if (dom) {
                   while (dom.firstChild) {
                       nextDom.appendChild(dom.firstChild)
                   }
                   if (parentNode) {
                       parentNode.replaceChild(nextDom, dom)
                   }
               }
               dom = nextDom
           }
           //必须在diffProps前添加它的dom
           vnode.dom = dom
           diffProps(vnode.props, prevProps, vnode, prevVnode)
           if (!vnode._hasSetInnerHTML && vnode.props) {
               diffChildren(vnode.props.children, prevChildren, vnode, context)
           }
           return dom
       }
       function clickHack() {}
       let inMobile = 'ontouchstart' in document

       /**
        * 收集DOM到组件实例的refs中
        * 
        * @param {any} instance 
        * @param {any} ref 
        * @param {any} dom 
        */
       function patchRef(instance, ref, dom, mount) {
           if (typeof ref === 'function') {
               ref(instance)
           } else if (typeof ref === 'string') {
               instance.refs[ref] = dom
               dom.getDOMNode = getDOMNode
           }
       }
       //fix 0.14对此方法的改动，之前refs里面保存的是虚拟DOM
       function getDOMNode() {
           return this
       }

       var builtIdProperties = /^(?:className|id|title|selected|htmlFor|value|checked|disabled)$/
     /**
      * 
      * 修改dom的属性与事件
      * @export
      * @param {any} props 
      * @param {any} prevProps 
      * @param {any} vnode 
      * @param {any} prevVnode 
      */
       function diffProps(props, prevProps, vnode, prevVnode) {
           if (props === prevProps) {
               return
           }
           var dom = vnode.dom

           var instance = vnode._owner
           if (vnode.type === 'option') {

               var value = typeof props.value === 'string' ? props.value : props.children[0].text
               var p = vnode._hostParent
               if (p.type === 'optgroup') {
                   p = p._hostParent
               }
               var selectValue = p.props.value
               var selected = value === selectValue
               var _hostInfo = prevVnode._hostInfo || {}
               if (_hostInfo.selected !== selected) {
                   dom.selected = selected
                   delete prevVnode._hostInfo
                   _hostInfo.selected = selected
               }
               vnode._hostInfo = _hostInfo
           }

           for (let name in props) {
               if (name === 'children') {
                   continue
               }
               var val = props[name]
               if (name === 'ref') {
                   if (prevProps[name] !== val) {
                       instance && patchRef(instance, val, dom)
                   }
                   continue
               }
               if (name === 'style') {
                   patchStyle(dom, prevProps.style || {}, val)
                   continue
               }
               if (name === 'dangerouslySetInnerHTML') {
                   var oldhtml = prevProps[name] && prevProps[name]._html
                   vnode._hasSetInnerHTML = true
                   if (val && val._html !== oldhtml) {
                       dom.innerHTML = val._html
                   }
               }
               if (isEvent(name)) {
                   if (!prevProps[name]) { //添加全局监听事件
                       var eventName = getBrowserName(name)
                       addGlobalEventListener(eventName)
                   }
                   if (inMobile && eventName === 'click') {
                       elem.addEventListener('click', clickHack)
                   }
                   var events = (dom.__events || (dom.__events = {}))
                   events[name] = val
                   continue
               }

               if (val !== prevProps[name]) {
                   //移除属性
                   if (val === false || val === void 666 || val === null) {
                       dom.removeAttribute(name)
                   } else { //添加新属性
                       if (builtIdProperties.test(name)) {
                           dom[name] = val + ''
                       } else {
                           dom.setAttribute(name, val + '')
                       }
                   }
               }
           }
           //如果旧属性在新属性对象不存在，那么移除DOM
           for (let name in prevProps) {
               if (!(name in props)) {
                   if (isEvent(name)) { //移除事件
                       var events = dom.__events || {}
                       delete events[name]
                   } else { //移除属性
                       if (builtIdProperties.test(name)) {
                           dom[name] = ''
                       } else {
                           dom.removeAttribute(name)
                       }
                   }
               }
           }
       }
       /**
        * 获取虚拟DOM对应的顶层组件实例的类型
        * 
        * @param {any} vnode 
        * @param {any} instance 
        * @param {any} pool 
        */
       function getTopComponentName(vnode, instance) {
           while (instance.parentInstance) {
               instance = nstance.parentInstance
           }
           var ctor = instance.statelessRender || instance.constructor
           return (ctor.displayName || ctor.name)
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
           return type + ':' + vnode.deep + (vnode.key !== null ? '/' + vnode.key : '')
       }

       /**
        * 
        * 
        * @param {any} newChildren 
        * @param {any} oldChildren 
        * @param {any} vParentNode 
        * @param {any} context 
        */
       function diffChildren(newChildren, oldChildren, vParentNode, context) {
           //第一步，根据实例的类型，nodeName, nodeValue, key与数组深度 构建hash
           var parentNode = vParentNode.dom
           var mapping = {}
           for (let i = 0, n = oldChildren.length; i < n; i++) {
               let vnode = oldChildren[i]
               let tag = vnode.instance ? getTopComponentName(vnode, vnode.instance) : vnode.type
               let uuid = computeUUID(tag, vnode)
               if (mapping[uuid]) {
                   mapping[uuid].push(vnode)
               } else {
                   mapping[uuid] = [vnode]
               }
           }

           //第二步，遍历新children, 从hash中取出旧节点
           var removedChildren = oldChildren.concat()
           for (let i = 0, n = newChildren.length; i < n; i++) {
               let vnode = newChildren[i];
               let Type = vnode.type
               let tag = typeof Type === 'function' ? (vnode._hasInstance = 1, Type.displatName || Type.name) : Type
               let uuid = computeUUID(tag, vnode)

               if (mapping[uuid]) {
                   var matchNode = mapping[uuid].shift()
                   if (!mapping[uuid].length) {
                       delete mapping[uuid]
                   }
                   if (matchNode) {
                       let index = removedChildren.indexOf(matchNode)
                       removedChildren.splice(index, 1)
                       vnode.prevVnode = matchNode
                       matchNode.use = true
                   }
               }
           };


           //第三，逐一比较
           for (let i = 0, n = newChildren.length; i < n; i++) {
               let vnode = newChildren[i]
               let prevVnode = null
               if (vnode.prevVnode) {
                   prevVnode = vnode.prevVnode
               } else {
                   var k
                   loop:
                       while (k = removedChildren.shift()) {
                           if (!k.use) {
                               prevVnode = k
                               break loop
                           }
                       }
               }
               vnode._hostParent = vParentNode
               if (vnode && prevVnode) { //假设两者都存在
                   var prevDom = prevVnode.dom
                   if (vnode.prevVnode && vnode._hasInstance) {
                       delete vnode.prevVnode
                       delete vnode._hasInstance
                       vnode.action = '重复利用旧的实例更新组件' //action只是调试用
                       diff(vnode, prevVnode, vParentNode, context)
                   } else if (vnode.type === prevVnode.type) {
                       if (vnode.type === '#text' || vnode.type === '#comment') {
                           vnode.dom = prevDom

                           if (vnode.text !== prevVnode.text) {
                               vnode.action = '改文本'
                               vnode.dom.nodeValue = vnode.text
                           } else {
                               vnode.action = '不改文本'
                           }
                       } else { //元素节点的比较
                           vnode.action = '更新元素'
                           diff(vnode, prevVnode, vParentNode, context)
                       }
                   } else if (vnode.type === '#text') { //#text === p
                       var dom = document.createTextNode(vnode.text)
                       vnode.dom = dom
                       parentNode.removeChild(prevDom)
                       vnode.action = '替换为文本'
                       removeComponent(prevVnode) //移除元素节点或组件
                   } else if (vnode.type === '#comment') { //#text === p
                       var dom = document.createComment(vnode.text)
                       vnode.dom = dom
                       parentNode.removeChild(prevDom)
                       vnode.action = '替换为文本'
                       removeComponent(prevVnode) //移除元素节点或组件
                   } else {
                       vnode.action = '替换为元素'
                       diff(vnode, prevVnode, vParentNode, context)
                   }
                   //当这个孩子是上级祖先传下来的，那么它是相等的
                   if (vnode !== prevVnode) {
                       delete prevVnode.dom //clear reference
                   }
               } else if (!prevVnode) { //添加新组件或元素节点
                   vnode.action = '添加新' + (vnode.type === '#text' ? '文本' : '元素')
                   if (!vnode.dom) {
                       var oldNode = oldChildren[i]

                       toDOM(vnode, context, parentNode, oldNode && oldNode.dom || null)
                   }
               }

               if (!parentNode.contains(vnode.dom)) {
                   parentNode.insertBefore(vnode.dom, newChildren[i].dom.nextSibling)
               }
           }

           //第4步，移除无用节点
           if (removedChildren.length) {
               for (let i = 0, n = removedChildren.length; i < n; i++) {
                   let vnode = removedChildren[i]
                   delete vnode._hostParent
                   parentNode.removeChild(vnode.dom)
                   vnode.props && removeComponent(vnode)
               }
           }

       }

       //var mountOrder = 0
       /**
        * 
        * 
        * @export
        * @param {VNode} vnode 
        * @param {DOM} context 
        * @param {DOM} parentNode ?
        * @param {DOM} replaced ?
        * @returns 
        */
       function toDOM(vnode, context, parentNode, replaced) {
           vnode = toVnode(vnode, context)
           var dom, isElement
           if (vnode.type === '#comment') {
               dom = document.createComment(vnode.text)
           } else
           if (vnode.type === '#text') {
               dom = document.createTextNode(vnode.text)
           } else {
               dom = document.createElement(vnode.type)
               isElement = true
           }

           var instance = vnode.instance
           var canComponentDidMount = instance && !vnode.dom
           vnode.dom = dom
           if (isElement) {
               diffProps(vnode.props, {}, vnode, {})
               if (!vnode._hasSetInnerHTML) {
                   diffChildren(vnode.props.children, [], vnode, context) //添加第4参数
               }
           }

           //尝试插入DOM树
           if (parentNode) {
               var instances, childInstance
               if (canComponentDidMount) { //判定能否调用componentDidMount方法
                   instances = getInstances(instance)
               }
               if (replaced) {
                   parentNode.replaceChild(dom, replaced)
               } else {
                   parentNode.appendChild(dom)
               }
               if (instances) {
                   //instance._mountOrder = mountOrder++;
                   while (instance = instances.shift()) {
                       applyComponentHook(instance, 2)
                   }
               }
           }
           return dom
       }

     /**
      * 
      * 
      * @param {any} props 
      * @param {any} context 
      */
     function Component(props, context) {
         this.context = context
         this.props = props
         this.uuid = Math.random()
         this.refs = {}
         if (!this.state)
             this.state = {}
     }


     Component.prototype = {

             setState(state, cb) {

                 setStateProxy(this, state, cb)
             },

             forceUpdate(cb) {
                 setStateProxy(this, this.state, cb, true)
             },

             render() {}

         }
         /**
          * 让外面的setState与forceUpdate都共用同一通道
          * 
          * @param {any} instance 
          * @param {any} state 
          * @param {any} cb fire by component did update
          * @param {any} force ignore shouldComponentUpdate
          */
     function setStateProxy(instance, state, cb, force) {
         if (typeof cb === 'function')
             transaction.enqueueCallback({ //确保回调先进入
                 component: instance,
                 cb: cb
             })
         transaction.enqueue({
             component: instance,
             state: state,
             init: force ? roughSetState : gentleSetState,
             exec: updateComponentProxy
         })

     }


     function gentleSetState() { //只有必要时才更新
         var instance = this.component
         var state = instance.state
         instance.prevState = instance.prevState || clone(state)
         var s = this.state
         extend(state, typeof s === 'function' ? s(state, instance.props) : s)
     }

     function roughSetState() { //强制更新
         var instance = this.component
         instance.forceUpdate = true
     }

     function updateComponentProxy() { //这里触发视图更新
         var instance = this.component
         if (!instance.vnode.dom) {
             var parentNode = instance.container
             instance.state = this.state //将merged state赋给它
             toDOM(instance.vnode, instance.context, parentNode)
         } else {
             updateComponent(this.component)
         }
         this.forceUpdate = false
     }

     var hasOwnProperty = Object.prototype.hasOwnProperty;

     /**
      * inlined Object.is polyfill to avoid requiring consumers ship their own
      * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
      */
     function is(x, y) {
         // SameValue algorithm
         if (x === y) {
             // Steps 1-5, 7-10
             // Steps 6.b-6.e: +0 != -0
             // Added the nonzero y check to make Flow happy, but it is redundant
             return x !== 0 || y !== 0 || 1 / x === 1 / y;
         } else {
             // Step 6.a: NaN == NaN
             return x !== x && y !== y;
         }
     }

     /**
      * Performs equality by iterating through keys on an object and returning false
      * when any key has values which are not strictly equal between the arguments.
      * Returns true when the values of all keys are strictly equal.
      */
     function shallowEqual(objA, objB) {
         if (is(objA, objB)) {
             return true;
         }

         if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
             return false;
         }

         var keysA = Object.keys(objA);
         var keysB = Object.keys(objB);
         if (keysA.length !== keysB.length) {
             return false;
         }

         // Test for A's keys different from B.
         for (var i = 0; i < keysA.length; i++) {
             if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
                 return false;
             }
         }

         return true;
     }

     function PureComponent(props, context) {
         this.props = props
         this.context = context
     }

     inherit(PureComponent, Component)

     let fn = PureComponent.prototype

     fn.shouldComponentUpdate = function shallowCompare(nextProps, nextState) {
         var a = shallowEqual(this.props, nextProps)
         var b = shallowEqual(this.state, nextState)
         return !a || !b
     }
     fn.isPureComponent = true

     var topLevelRootCounter = 1
     function TopLevelWrapper() {
         this.rootID = topLevelRootCounter++
     }

     inherit(TopLevelWrapper, Component)

     let fn$1 = TopLevelWrapper.prototype
     fn$1.render = function() {
         return this.props.child
     }

     var React = {
         render,
         createElement,
         PureComponent,
         Component
     }
     var shallowEqualHack = Object.freeze([]) //用于绕过shallowEqual
         /**
          * 创建虚拟DOM
          * 
          * @param {string} type 
          * @param {object} props 
          * @param {array} children 
          * @returns 
          */
     function createElement(type, configs, children) {
         var props = {}
         var key = null
         configs = configs || {}
         if (configs.key != null) {
             key = configs.key + ''
             delete configs.key
         }
         extend(props, configs)
         var c = [].slice.call(arguments, 2)
         var useEmpty = true
         if (!c.length) {
             if (props.children) {
                 c = props.children
                 useEmpty = false
             }
         } else {
             useEmpty = false
         }
         if (useEmpty) {
             c = shallowEqualHack
         } else {
             c = flatChildren(c)
             delete c.merge //注意这里的顺序
             Object.freeze(c)
         }
         props.children = c
         Object.freeze(props)
         return new Vnode(type, props, key, CurrentOwner.cur)
     }

     function Vnode(type, props, key, owner) {
         this.type = type
         this.props = props
         this.key = key || null
         this._owner = owner || null
     }

     Vnode.prototype = {
         getDOMNode: function() {
             return this.dom || null
         },
         $$typeof: 1
     }

     /**
      * 遍平化children，并合并相邻的简单数据类型
      * 
      * @param {array} children 
      * @param {any} [ret=[]] 
      * @returns 
      */

     function flatChildren(children, ret, deep) {
         ret = ret || []
         deep = deep || 0
         for (var i = children.length; i--;) { //从后向前添加
             var el = children[i]
             if (el == null) {
                 el = ''
             }
             var type = typeof el
             if (el === '' || type === 'boolean') {
                 continue
             }
             if (/number|string/.test(type) || el.type === '#text') {
                 if (el === '' || el.text == '') {
                     continue
                 }
                 if (ret.merge) {
                     ret[0].text = (el.type ? el.text : el) + ret[0].text
                 } else {
                     ret.unshift(el.type ? el : { type: '#text', text: String(el), deep: deep })
                     ret.merge = true
                 }
             } else if (Array.isArray(el)) {
                 flatChildren(el, ret, deep + 1)
             } else {
                 ret.unshift(el)
                 el.deep = deep
                 ret.merge = false
             }

         }
         return ret
     }
     /**
      * 
      * @param {any} vnode 
      * @param {any} container 
      */
     function render(vnode, container, cb) {
         container.textContent = ''
         while (container.firstChild) {
             container.removeChild(container.firstChild)
         }
         var root = createElement(TopLevelWrapper, { child: vnode });
         transaction.isInTransation = true
         var root = toVnode(vnode, {})
         transaction.isInTransation = false
         root.instance.container = container
         root.instance.forceUpdate(cb)
         return root.instance || null
     }



     window.ReactDOM = React

     return React;

}));
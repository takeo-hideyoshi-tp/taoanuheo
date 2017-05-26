(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.ReactDOMServer = factory());
}(this, function () {

  /**
   * 复制一个对象的属性到另一个对象
   *
   * @param {any} obj
   * @param {any} props
   * @returns
   */
  function extend(obj, props) {
      if (props) {
          for (var i in props) {
              if (props.hasOwnProperty(i)) obj[i] = props[i];
          }
      }
      return obj;
  }
  var rword = /[^, ]+/g;

  function oneObject(array, val) {
      if (typeof array === 'string') {
          array = array.match(rword) || [];
      }
      var result = {},
          value = val !== void 0 ? val : 1;
      for (var i = 0, n = array.length; i < n; i++) {
          result[array[i]] = value;
      }
      return result;
  }

  function getContext(instance, context) {
      if (instance.getChildContext) {
          return extend(extend({}, context), instance.getChildContext());
      }
      return context;
  }

  var rnumber = /^-?\d+(\.\d+)?$/;
  var cssNumber = oneObject('animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom');

  var cssMap = oneObject('float', 'cssFloat');

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var asyncGenerator = function () {
    function AwaitValue(value) {
      this.value = value;
    }

    function AsyncGenerator(gen) {
      var front, back;

      function send(key, arg) {
        return new Promise(function (resolve, reject) {
          var request = {
            key: key,
            arg: arg,
            resolve: resolve,
            reject: reject,
            next: null
          };

          if (back) {
            back = back.next = request;
          } else {
            front = back = request;
            resume(key, arg);
          }
        });
      }

      function resume(key, arg) {
        try {
          var result = gen[key](arg);
          var value = result.value;

          if (value instanceof AwaitValue) {
            Promise.resolve(value.value).then(function (arg) {
              resume("next", arg);
            }, function (arg) {
              resume("throw", arg);
            });
          } else {
            settle(result.done ? "return" : "normal", result.value);
          }
        } catch (err) {
          settle("throw", err);
        }
      }

      function settle(type, value) {
        switch (type) {
          case "return":
            front.resolve({
              value: value,
              done: true
            });
            break;

          case "throw":
            front.reject(value);
            break;

          default:
            front.resolve({
              value: value,
              done: false
            });
            break;
        }

        front = front.next;

        if (front) {
          resume(front.key, front.arg);
        } else {
          back = null;
        }
      }

      this._invoke = send;

      if (typeof gen.return !== "function") {
        this.return = undefined;
      }
    }

    if (typeof Symbol === "function" && Symbol.asyncIterator) {
      AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
        return this;
      };
    }

    AsyncGenerator.prototype.next = function (arg) {
      return this._invoke("next", arg);
    };

    AsyncGenerator.prototype.throw = function (arg) {
      return this._invoke("throw", arg);
    };

    AsyncGenerator.prototype.return = function (arg) {
      return this._invoke("return", arg);
    };

    return {
      wrap: function (fn) {
        return function () {
          return new AsyncGenerator(fn.apply(this, arguments));
        };
      },
      await: function (value) {
        return new AwaitValue(value);
      }
    };
  }();

  var React = global.React;
  var skipAttributes = {
      ref: 1,
      key: 1,
      children: 1
  };
  var Component = React.Component;
  function renderVNode(vnode, context) {
      var _vnode = vnode,
          vtype = _vnode.vtype,
          type = _vnode.type,
          props = _vnode.props;

      switch (type) {
          case '#text':
              return encodeEntities(vnode.text);
          case '#comment':
              return '<!--' + vnode.text + '-->';
          default:
              var innerHTML = props && props.dangerouslySetInnerHTML;
              innerHTML = innerHTML && innerHTML.__html;
              if (vtype === 1) {
                  var attrs = [];
                  for (var i in props) {
                      var v = props[i];
                      if (skipAttributes[i] || /^on[A-Z]/.test(i) && (skipAttributes[i] = true)) {
                          continue;
                      }

                      if (name === 'className' || name === 'class') {
                          name = 'class';
                          if (v && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object') {
                              v = hashToClassName(v);
                          }
                      } else if (name.match(rXlink)) {
                          name = name.toLowerCase().replace(rXlink, 'xlink:$1');
                      } else if (name === 'style' && v && (typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object') {
                          v = styleObjToCss(v);
                      }
                      if (skipFalseAndFunction(val)) {
                          attrs.push(i + '=' + encodeAttributes(v + ''));
                      }
                  }
                  attrs = attrs.length ? ' ' + attrs.join(' ') : '';
                  var str = '<' + type + attrs;
                  if (voidTags[type]) {
                      return str + '/>\n';
                  }
                  str += '>';
                  if (innerHTML) {
                      str += innerHTML;
                  } else {
                      str += props.children.map(function (el) {
                          return el ? renderVNode(el, context) : '';
                      }).join('');
                  }
                  return str + '</' + type + '>\n';
              } else if (vtype > 1) {
                  var data = {
                      context: context
                  };
                  vnode = toVnode(vnode, data);
                  context = data.context;
                  return renderVNode(vnode, context);
              } else {
                  throw '数据不合法';
              }
      }
  }

  function hashToClassName() {
      var arr = [];
      for (var i in obj) {
          if (obj[i]) {
              arr.push(i);
          }
      }
      return arr.join(' ');
  }
  var rXlink = /^xlink\:?(.+)/;

  var voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

  function skipFalseAndFunction(a) {
      return a !== false && Object(a) !== a;
  }

  function styleObjToCss(obj) {
      var arr = [];
      for (var i in obj) {
          var val = obj[i];
          if (obj != null) {
              var unit = '';
              if (rnumber.test(val) && !cssNumber[name]) {
                  unit = 'px';
              }
              arr.push(cssName(name) + ': ' + val + unit);
          }
      }
      return arr.join('; ');
  }
  var cssCached = {
      styleFloat: 'float',
      cssFloat: 'float'
  };

  function cssName(name) {
      if (cssCached[name]) return cssCached[name];

      return cssCached[name] = name.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  //===============重新实现transaction＝＝＝＝＝＝＝＝＝＝＝
  function setStateWarn() {}
  var transaction = {
      renderWithoutSetState: function renderWithoutSetState(instance, nextProps, context) {
          instance.setState = instance.forceUpdate = setStateWarn;
          try {
              var vnode = instance.render(nextProps, context);
              if (vnode === null) {
                  vnode = {
                      type: '#comment',
                      text: 'empty'
                  };
              }
          } finally {
              delete instance.setState;
              delete instance.forceUpdate;
          }
          return vnode;
      }
  };

  function toVnode(vnode, data, parentInstance) {
      var context = data.context;
      var Type = vnode.type,
          instance,
          rendered;

      if (vnode.vtype > 1) {
          var props = vnode.props;
          if (vnode.vtype === 4) {
              //处理无状态组件
              instance = new Component(null, context);
              instance.render = instance.statelessRender = Type;
              rendered = transaction.renderWithoutSetState(instance, props, context);
          } else {

              //处理普通组件
              var defaultProps = Type.defaultProps;
              props = extend({}, props); //注意，上面传下来的props已经被冻结，无法修改，需要先复制一份
              for (var i in defaultProps) {
                  if (props[i] === void 666) {
                      props[i] = defaultProps[i];
                  }
              }
              instance = new Type(props, context);

              //必须在这里添加vnode，因为willComponent里可能进行setState操作
              Component.call(instance, props, context); //重点！！
              instance.componentWillMount && instance.componentWillMount();

              rendered = transaction.renderWithoutSetState(instance);
          }
          instance._rendered = rendered;

          vnode._instance = instance;

          if (parentInstance) {
              instance.parentInstance = parentInstance;
          }

          // <App />下面存在<A ref="a"/>那么AppInstance.refs.a = AInstance
          // patchRef(vnode._owner, vnode.props.ref, instance)

          if (instance.getChildContext) {
              data.context = getContext(instance, context); //将context往下传
          }
          return toVnode(rendered, data, instance);
      } else {
          return vnode;
      }
  }
  //==================实现序列化文本节点与属性值的相关方法=============

  var matchHtmlRegExp = /["'&<>]/;

  function escapeHtml(string) {
      var str = '' + string;
      var match = matchHtmlRegExp.exec(str);

      if (!match) {
          return str;
      }

      var escape;
      var html = '';
      var index = 0;
      var lastIndex = 0;

      for (index = match.index; index < str.length; index++) {
          switch (str.charCodeAt(index)) {
              case 34:
                  // "
                  escape = '&quot;';
                  break;
              case 38:
                  // &
                  escape = '&amp;';
                  break;
              case 39:
                  // '
                  escape = '&#x27;'; // modified from escape-html; used to be '&#39'
                  break;
              case 60:
                  // <
                  escape = '&lt;';
                  break;
              case 62:
                  // >
                  escape = '&gt;';
                  break;
              default:
                  continue;
          }

          if (lastIndex !== index) {
              html += str.substring(lastIndex, index);
          }

          lastIndex = index + 1;
          html += escape;
      }

      return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
  }

  function encodeEntities(text) {
      if (typeof text === 'boolean' || typeof text === 'number') {
          return '' + text;
      }
      return escapeHtml(text);
  }

  function encodeAttributes(value) {
      return '"' + encodeEntities(value) + '"';
  }

  function renderToString(vnode, context) {
      var TAG_END = /\/?>/;
      var COMMENT_START = /^<\!\-\-/;
      var markup = renderVNode(vnode, context || {});
      var checksum = adler32(markup);
      // Add checksum (handle both parent tags, comments and self-closing tags)
      if (COMMENT_START.test(markup)) {
          return markup;
      } else {
          return markup.replace(TAG_END, ' data-reactroot="" data-react-checksum="' + checksum + '"$&');
      }
  }

  var MOD = 65521;

  // adler32 is not cryptographically strong, and is only used to sanity check
  // that markup generated on the server matches the markup generated on the
  // client. This implementation (a modified version of the SheetJS version) has
  // been optimized for our use case, at the expense of conforming to the adler32
  // specification for non-ascii inputs.
  function adler32(data) {
      var a = 1;
      var b = 0;
      var i = 0;
      var l = data.length;
      var m = l & ~0x3;
      while (i < m) {
          var n = Math.min(i + 4096, m);
          for (; i < n; i += 4) {
              b += (a += data.charCodeAt(i)) + (a += data.charCodeAt(i + 1)) + (a += data.charCodeAt(i + 2)) + (a += data.charCodeAt(i + 3));
          }
          a %= MOD;
          b %= MOD;
      }
      for (; i < l; i++) {
          b += a += data.charCodeAt(i);
      }
      a %= MOD;
      b %= MOD;
      return a | b << 16;
  }
  var index = {
      renderToString: renderToString
  };

  return index;

}));
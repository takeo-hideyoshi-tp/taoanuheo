import { document, msie } from "./browser";
import {
  eventHooks,
  addEvent,
  eventPropHooks,
  dispatchEvent,
  SyntheticEvent
} from "./event";
import { oneObject, clearArray } from "./util";


//Ie6-8 oninput使用propertychange进行冒充，触发一个ondatasetchanged事件
function fixIEInputHandle(e) {
  if (e.propertyName === "value") {
    dispatchEvent(e, "input");
  }
}
function fixIEInput(dom) {
  addEvent(dom, "propertychange", fixIEInputHandle);
}

function fixIEChangeHandle(e) {
  var dom = e.srcElement;
  if (dom.type === "select-one") {
    var idx = dom.selectedIndex,
      option,
      attr;
    if (idx > -1) {
      //IE 下select.value不会改变
      option = dom.options[idx];
      attr = option.attributes.value;
      dom.value = attr && attr.specified ? option.value : option.text;
    }
  }

  dispatchEvent(e, "change");
}
function fixIEChange(dom) {
  //IE6-8, radio, checkbox的点击事件必须在失去焦点时才触发
  var eventType =
    dom.type === "radio" || dom.type === "checkbox" ? "click" : "change";
  addEvent(dom, eventType, fixIEChangeHandle);
}

function fixIESubmit(dom) {
  if (dom.nodeName === "FORM") {
    addEvent(dom, "submit", dispatchEvent);
  }
}

if (msie < 9) {
  String("focus,blur").replace(/\w+/g, function (type) {
    eventHooks[type] = function (dom) {
      var eventType = type === "focus" ? "focusin" : "focusout";
      addEvent(dom, eventType, function (e) {
        dispatchEvent(e, type);
      });
    };
  });
  /**
   * 
  DOM通过event对象的relatedTarget属性提供了相关元素的信息。这个属性只对于mouseover和mouseout事件才包含值；
  对于其他事件，这个属性的值是null。IE不支持realtedTarget属性，但提供了保存着同样信息的不同属性。
  在mouseover事件触发时，IE的fromElement属性中保存了相关元素；
  在mouseout事件出发时，IE的toElement属性中保存着相关元素。
  可以把下面这个跨浏览器取得相关元素的方法添加到EventUtil对象中：
   */
  function getRelatedTarget(e) {
    return e.fromElement === e.target ?
      e.toElement :
      e.fromElement;
  }
  String("mouseenter,mouseleave").replace(/\w+/g, function (type) {
    eventHooks[type] = function (dom) {
      var eventType = type === "mouseenter" ? "mouseover" : "mouseout";
      addEvent(dom, eventType, function (e) {
        var t = getRelatedTarget(e)
        if (!t || (t !== dom && !dom.contains(t))) {
          dispatchEvent(e, type);
        }
      });
    };
  });
  Object.assign(
    eventPropHooks,
    oneObject(
      "mousemove, mouseout,mouseenter, mouseleave, mouseout,mousewheel, mousewheel, whe" +
      "el, click",
      function (event) {
        if (!("pageX" in event)) {
          var doc = event.target.ownerDocument || document;
          var box =
            doc.compatMode === "BackCompat" ? doc.body : doc.documentElement;
          event.pageX =
            event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0);
          event.pageY =
            event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0);
        }
      }
    )
  );

  Object.assign(
    eventPropHooks,
    oneObject("keyup, keydown, keypress", function (event) {
      /* istanbul ignore next  */
      if (event.which == null && event.type.indexOf("key") === 0) {
        /* istanbul ignore next  */
        event.which = event.charCode != null ? event.charCode : event.keyCode;
      }
    })
  );

  //IE8中select.value不会在onchange事件中随用户的选中而改变其value值，也不让用户直接修改value 只能通过这个hack改变
  try {
    Object.defineProperty(HTMLSelectElement.prototype, "value", {
      set: function (v) {
        this._fixIEValue = v;
      },
      get: function () {
        return this._fixIEValue;
      }
    });
  } catch (e) {
    // no catch
  }
  eventHooks.input = fixIEInput;
  eventHooks.inputcapture = fixIEInput;
  eventHooks.change = fixIEChange;
  eventHooks.changecapture = fixIEChange;
  eventHooks.submit = fixIESubmit;
}

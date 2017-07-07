import { oneObject, recyclables, toLowerCase,typeNumber } from "./util";

//用于后端的元素节点
export function DOMElement(type) {
  this.nodeName = type;
  this.style = {};
  this.children = [];
}
var fn = (DOMElement.prototype = {
  contains: Boolean
});
String(
  "replaceChild,appendChild,removeAttributeNS,setAttributeNS,removeAttribute,setAttribute" +
    ",getAttribute,insertBefore,removeChild,addEventListener,removeEventListener,attachEvent" +
    ",detachEvent"
).replace(/\w+/g, function(name) {
  fn[name] = function() {
    console.log("fire " + name);
  };
});

//用于后端的document
export var fakeDoc = new DOMElement();
fakeDoc.createElement = fakeDoc.createElementNS = fakeDoc.createDocumentFragment = function(
  type
) {
  return new DOMElement(type);
};
fakeDoc.createTextNode = fakeDoc.createComment = Boolean;
fakeDoc.documentElement = new DOMElement("html");
fakeDoc.nodeName = "#document";
fakeDoc.textContent = "";
export var inBrowser = typeNumber(window) === 7 && window.alert;

export var win = inBrowser
  ? window
  : {
      document: fakeDoc
    };

export var document = win.document || fakeDoc;
var isStandard = "textContent" in document;
var fragment = document.createDocumentFragment();
function emptyElement(node) {
  var child;
  while ((child = node.firstChild)) {
    if (child.nodeType === 1) {
      emptyElement(child);
    }
    node.removeChild(child);
  }
}

export function removeDOMElement(node) {
  if (node.nodeType === 1) {
    if (isStandard) {
      node.textContent = "";
    } else {
      emptyElement(node);
    }
  }
  fragment.appendChild(node);
  fragment.removeChild(node);
  var nodeName = node.__n || (node.__n = toLowerCase(node.nodeName));
  node.__events = null;
  if (recyclables[nodeName] && recyclables[nodeName].length < 72) {
    recyclables[nodeName].push(node);
  } else {
    recyclables[nodeName] = [node];
  }
}

var versions = {
  //  objectobject: 7, //IE7-8
  //  objectundefined: 6, //IE6
  // undefinedfunction: NaN, // other modern browsers
  // undefinedobject: NaN
  77: 7,
  70: 6,
  "00": NaN,
  "07": NaN
};
/* istanbul ignore next  */
export var msie =
  document.documentMode ||
  versions[typeNumber(document.all) + "" + typeNumber(XMLHttpRequest)];

export var modern = /NaN|undefined/.test(msie) || msie > 8;

export function createDOMElement(vnode) {
  var type = vnode.type;
  var node = recyclables[type] && recyclables[type].pop();
  if (node) {
    node.nodeValue = vnode.text;
    return node;
  }
  if (type === "#text") {
    return document.createTextNode(vnode.text);
  }
  if (type === "#comment") {
    return document.createComment(vnode.text);
  }

  try {
    if (vnode.ns) {
      return document.createElementNS(vnode.ns, type);
    }
    //eslint-disable-next-line
  } catch (e) {}
  return document.createElement(type);
}
// https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math
// http://demo.yanue.net/HTML5element/
var mhtml = {
  meter: 1,
  menu: 1,
  map: 1,
  meta: 1,
  mark: 1
};
var svgTags = oneObject(
  "" +
    // structure
    "svg,g,defs,desc,metadata,symbol,use," +
    // image & shape
    "image,path,rect,circle,line,ellipse,polyline,polygon," +
    // text
    "text,tspan,tref,textpath," +
    // other
    "marker,pattern,clippath,mask,filter,cursor,view,animate," +
    // font
    "font,font-face,glyph,missing-glyph",
  svgNs
);

var rmathTags = /^m/;
var mathNs = "http://www.w3.org/1998/Math/MathML";
var svgNs = "http://www.w3.org/2000/svg";
var mathTags = {
  semantics: mathNs
};

export function getNs(type) {
  if (svgTags[type]) {
    return svgNs;
  } else if (mathTags[type]) {
    return mathNs;
  } else {
    if (!mhtml[type] && rmathTags.test(type)) {
      //eslint-disable-next-line
      return (mathTags[type] = mathNs);
    }
  }
}

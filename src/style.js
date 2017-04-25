import { oneObject, camelize } from './util'
var rnumber = /^-?\d+(\.\d+)?$/
    /**
     * 为元素样子设置样式
     * 
     * @export
     * @param {any} dom 
     * @param {any} oldStyle 
     * @param {any} newStyle 
     */
export function patchStyle(dom, oldStyle, newStyle) {
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
    host = dom && dom.style || {}
    for (var i = 0, n = prefixes.length; i < n; i++) {
        camelCase = camelize(prefixes[i] + name)
        if (camelCase in host) {
            return (cssMap[name] = camelCase)
        }
    }
    return null
}
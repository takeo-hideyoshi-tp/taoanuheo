import { eventSystem } from "./eventSystem";
import { render } from "react-fiber/scheduleWork";
import { createElement } from "react-core/createElement";
import { isFn } from "react-core/util";

export function createPage(PageClass, path) {
    //添加一个全局代理的事件句柄
    PageClass.prototype.dispatchEvent = eventSystem.dispatchEvent;
    //劫持页面组件的生命周期，与setState进行联动
    //获取页面的组件实例
    var instance = render(
        createElement(PageClass, {
            path: path,
            isPageComponent: true
        }),
        {
            type: "page",
            props: {},
            children: [],
            root: true,
            appendChild: function() {}
        }
    );
    if (!instance.instanceCode) {
        instance.instanceCode = Math.random();
    }
    if (!PageClass.instances) {
        PageClass.instances = [];
    }
    PageClass.instances.push(instance);
    //用于事件委托中
    instance.props.instanceCode = instance.instanceCode;
    //劫持setState
    var anuSetState = instance.setState;
    var anuForceUpdate = instance.forceUpdate;
    var updating = false,
        canSetData = false;
    instance.forceUpdate = instance.setState = function(a) {
        var updateMethod = anuSetState;
        var cbIndex = 1;
        if (isFn(a) || a == null) {
            updateMethod = anuForceUpdate;
            cbIndex = 0;
        }
        var pageInst = this.$pageInst || this;
        if (updating === false) {
            //如果这是页面组件，则直接清空所有子组件
            if (pageInst == this) {
                pageInst.allTemplateData = []; //清空子组件
            } else {
                //如果是页面的子组件，通过template收集
                this.updateWXData = true;
            }
            canSetData = true;
            updating = true;
        }
        var inst = this,
            cb = arguments[cbIndex],
            args = Array.prototype.slice.call(arguments);
        args[cbIndex] = function() {
            cb && cb.call(inst);
            if (canSetData) {
                canSetData = false;
                updating = false;
                var data = {
                    state: pageInst.state,
                    props: pageInst.props
                };
                applyChildComponentData(data, pageInst.allTemplateData || []);
                pageInst.$wxPage.setData(data);
            }
        };
        updateMethod.apply(this, args);
       
    };

    var unmountHook = "componentWillUnmount";
    var config = {
        data: {
            state: instance.state,
            props: instance.props
        },
        dispatchEvent: eventSystem.dispatchEvent,
        onLoad: function() {
            instance.$wxPage = this;
        },
        onUnload: function() {
            var index = PageClass.instances.indexOf(instance);
            if (index !== -1) {
                PageClass.instances.splice(index, 1);
            }
            if (isFn(instance[unmountHook])) {
                instance[unmountHook]();
            }
        }
    };
    //添加子组件的数据
    applyChildComponentData(config.data, instance.allTemplateData || []);
    return config;
}

function applyChildComponentData(data, list) {
    list.forEach(function(el) {
        if (data[el.templatedata]) {
            data[el.templatedata].push(el);
        } else {
            data[el.templatedata] = [el];
        }
    });
}

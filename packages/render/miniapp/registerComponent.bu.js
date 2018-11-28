import { registeredComponents, usingComponents, updateMiniApp } from './utils';
import { dispatchEvent } from './eventSystem';

export function registerComponent(type, name) {
    registeredComponents[name] = type;
    var reactInstances = (type.reactInstances = []);
    var wxInstances = (type.wxInstances = []);
    return {
        data: {
            props: {},
            state: {},
            context: {}
        },

        attached() {
            usingComponents[name] = type;
            var uuid = this.dataset.instanceUid;
            for (var i = reactInstances.length - 1; i >= 0; i--) {
                var reactInstance = reactInstances[i];
                if (reactInstance.instanceUid === uuid) {
                    reactInstance.wx = this;
                    this.reactInstance = reactInstance;
                    updateMiniApp(reactInstance);
                    reactInstances.splice(i, 1);
                    break;
                }
            }
            if (!this.reactInstance) {
                wxInstances.push(this);
            }
        },
        detached() {
            let t = this.reactInstance;
            if (t) {
                t.wx = null;
                this.reactInstance = null;
            }
            console.log('detached...', name);//eslint-disabled-line
        },
        dispatchEvent
    };
}
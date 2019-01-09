import { registeredComponents, usingComponents, refreshComponent, disposeComponent } from './utils'
import { dispatchEvent } from './eventSystem'

export function registerComponent (type, name) {
  registeredComponents[name] = type
  let reactInstances = type.reactInstances = []
  type.wxInstances = {}
  return {
    data: {
      props: {},
      state: {},
      context: {}
    },

    attached() {
      usingComponents[name] = type
      let uuid = this.dataset.instanceUid || null
      refreshComponent(reactInstances, this, uuid)
    },
    detached: disposeComponent,
    dispatchEvent: dispatchEvent
  }
}

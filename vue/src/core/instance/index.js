import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

/* 
 * Vue 对象的定义, 通过 new Vue 去实例化它
 * why not Calss ?
 * Vue 按功能把这些扩展分散到多个模块中去实现, 而不是在一个模块里实现所有, 这种方式是用 Class 难以实现的
 */
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // _init 定义在 src/core/instance/init.js, 通过 initMixin(Vue) 加到 Vue.prototype._init
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue

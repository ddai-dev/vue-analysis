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
 * 
 * 
 * 生命周期
 * https://vue-js.com/learn-vue/lifecycle/#_2-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%B5%81%E7%A8%8B%E5%9B%BE
 * 
 * - 初始化阶段：为Vue实例上初始化一些属性，事件以及响应式数据
 * - 模板编译阶段：将模板编译成渲染函数
 * - 挂载阶段：将实例挂载到指定的DOM上，即将模板渲染到真实DOM中；
 * - 销毁阶段：将实例自身从父组件中删除，并取消依赖追踪及事件监听
 *   
 * 
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

// add Vue.prototype._init method
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue

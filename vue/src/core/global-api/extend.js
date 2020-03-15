/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   * 一边给子类加上独有的属性, 一边将父类的公共属性复制到子类上
   * 
   * var Profile = Vue.extend({
   * template: '<p>{{firstName}} {{lastName}} aka {{alias}}</p>',
   * data: function () {
   *   return {
   *     firstName: 'Walter',
   *     lastName: 'White',
   *     alias: 'Heisenberg'
   *   }
   * }
   * })
   // 创建 Profile 实例，并挂载到一个元素上。
   new Profile().$mount('##mount-point') => <p>Walter White aka Heisenberg</p>
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {} // 用户传入的一个包含组件选项的对象参数
    const Super = this // 指向父类，即基础 Vue(this) 类
    const SuperId = Super.cid // 无论是基础 Vue类还是从基础 Vue类继承而来的类，都有一个cid属性，作为该类的唯一标识
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {}) //缓存池，用于缓存创建出来的类
    if (cachedCtors[SuperId]) { 
      // extendOptions._Ctor 拥有了 VueComponent 
      return cachedCtors[SuperId]
    }

    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      // 校验组件的名字是否合法
      validateComponentName(name)
    }

    // 创建一个 Sub 类
    const Sub = function VueComponent (options) {
      this._init(options)
    }
    // 让 Sub 类去基础类 Vue, 让其具备一些基础 Vue 类的能力
    // 继续父类的原型链
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    // 将父类的options与子类的options进行合并
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    // 将父类保存到子类的super属性中，以确保在子类中能够拿到父类
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      // 初始化 props 属性其实就是把参数中传入的 props 选项代理到原型 _props 中
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    // component directive filter
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    // 暴露更多的属性
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}

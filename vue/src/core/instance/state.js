/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute
} from '../util/index'

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 *  初始化了 vm 的 _watchers 属性
 *  init props
 *  init methods
 *  init data 
 * 
 * @param {props methods data computed watch 是有顺序的} vm 
 */
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  // props 用于接收父组件的数据
  if (opts.props) initProps(vm, opts.props)
  // methods 将被混入到 Vue 实例中
  if (opts.methods) initMethods(vm, opts.methods)
  // Vue 实例的数据对象
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  // 计算属性将被混入到 Vue 实例中
  if (opts.computed) initComputed(vm, opts.computed)
  // Vue 实例将会在实例化时调用 $watch()，遍历 watch 对象的每一个属性
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
/**
 * 
 * @param  vm 当前 Vue 实例
 * @param {*} propsOptions  当前实例规范化后的 props
 */
function initProps (vm: Component, propsOptions: Object) {
  // propsData 创建实例时传递 props。主要作用是方便测试
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted 
  // 判断当前组件是否为根组件，如果不是，那么不需要将props数组转换为响应式的
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (vm.$parent && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 如果在 vm 中不存在的属性, 则代理
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}

function initData (vm: Component) {
  let data = vm.$options.data
  // data 推荐函数, return Object （如果是函数, 则调用 getData(data, vm) 执行返回一个对象
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // 如果 methods 存在, 并且有 key , 则警告 (因为 key 在  data methods props 三者中唯一 )
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    // 如果 props 存在, 并且有 key , 则警告 (因为 key 在  data methods props 三者中唯一 )
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      // 代理, 这里实现了 vm[key] -> vm._data[key] 的方式来实现数据代理 proxy
      proxy(vm, `_data`, key)
    }
  }
  // observe data 对初始化数据进行观察
  observe(data, true /* asRootData */)
}

export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

const computedWatcherOptions = { computed: true }
/**
 computed: {
    // 仅读取
    aDouble: function () {
      return this.a * 2
    },
    // 读取和设置
    aPlus: {
      get: function () {
        return this.a + 1
      },
      set: function (v) {
        this.a = v - 1
      }
    }
  }
 */
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    // 如果是函数, 那直接作为 getter
    // 如果是对象, 则获取 get 属性 作为 getter 函数
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      // 创建 watcher 对象
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    // 如果当前属性已经存在于 vm 实例上, 则警告, 不存在, 则在 vm 上面设置计算属性
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}
/**
 * 在 target(vm) 上定义一个属性 key, 并且属性key的getter和setter根据userDef的值来设置 
 * @param {*} target 
 * @param {*} key 
 * @param {*} userDef  是一个普通的函数, 并没有缓存功能, 所以通过 createComputedGetter 加入了缓存功能 
 */
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : userDef
      // userDef 为 fn 并没有定义 set, 所以 默认为 noop
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set
      : noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
/**
 * const computedWatcherOptions = { computed: true }
 * watchers[key] = new Watcher(
 *     vm,
 *     getter || noop, (关注)
 *     noop,
 *     computedWatcherOptions (关注)
 * )
 *  
 * @param {创建带有缓存功能的 computed 属性} key 
 */
function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    // 调用watcher 的 depend 和 evaluate 的返回值作为计算属性的计算结果返回
    // this.dirty 标志计算属性的返回值是否有变化, 如果有则重新计算, 否则直接从缓存返回
    if (watcher) {
      // 读取计算属性的那个 watcher 添加到计算属性的 watcher 实例的依赖列表中
      // 当计算属性中用到的数据发生变化时, 计算属性的 watcher 实例就会执行 watcher.update 方法
      // 在update方法中会判断当前的watcher是不是计算属性的watcher，如果是则调用getAndInvoke去对比计算属性的返回值是否发生了变化，如果真的发生变化，则执行回调，通知那些读取计算属性的watcher重新执行渲染逻辑
      watcher.depend()
      return watcher.evaluate()
    }
  }
}

function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      if (methods[key] == null) {
        warn(
          `Method "${key}" has an undefined value in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      // 如果是以 _ 或 $ 开头的, 提示命名不规范
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // vm[methodName] 调用函数, 并且绑定函数的 this 为 vm
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm)
  }
}

function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
/**
 * 
 * @param {*} vm 
 * @param {被侦听的属性表达式} expOrFn 
 * @param {watch 选项中每一项值} handler 
 * @param {用于传递给vm.$watch的选项对象} options 
 */
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  // 如果是对象的写法如下
  // watch: {
  //   c: {
  //       handler: function (val, oldVal) { /* ... */ },
	//     	 deep: true
  //   }
  // }
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  // watch: {
  //   methods选项中的方法名
  //   b: 'someMethod',
  // }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  // 既不是对象又不是函数, 我们认为他是一个函数, 不做任何处理(handler 还是 handler)
  // 侦听属性
  return vm.$watch(expOrFn, handler, options)
}

export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function (newData: Object) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}

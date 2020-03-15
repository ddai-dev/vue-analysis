/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

// import Vue from 'vue' 通过这里进行的初始化
import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// 缓存原型上面的 $mount 方法, 然后重新定义
// 原型上的 $mount 在 src/platform/web/runtime/index.js 定义, 
// 之所以这么设计完全是为了复用 (delegate design pattern)，因为它(Vue.prototype.$mount)是可以被 runtime only 版本的 Vue 直接使用的
// compiler 环境, 需要生成 render
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  // vue 不能挂在到 body 以及 document.documentElement (html) 这样的节点上面
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  // 转换为统一 API render 函数
  if (!options.render) {
    let template = options.template
    if (template) {
      //  template 以 string 开头, 则根据 id 获取元素的内容
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          // innerHTML vs outerHTML (outerHTML contains tag )
          // 查询对应的 DOM 元素, 获取 innerHTML (<div id="app">XXXX</div> ) XXX 内容
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        // template 直接就是 DOM, 直接获取 innerHTML
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 没有传递 template, 传递的 el 元素, 获取元素自身字符串  如 ( <div>{{message}}</div> 字符串形式)
      template = getOuterHTML(el)
    }
    // 如果模板存在, 则需要进行编译
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // 编译并使用, src/core/instance/lifecycle.js (compileToFunctions), 最终的目的就是生成 render 
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 最终调用的还是  Vue.prototype.$mount 函数挂载编译后的 render (前面的代码其实对函数的功能进行了增强)
  // src/platform/web/runtime/index.js -> Vue.prototype.$mount
  //    -> core/instance/lifecycle -> mountComponent  
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue

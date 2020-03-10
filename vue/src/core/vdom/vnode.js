/* @flow */

/**
 * VNode 的类型
 * - 注释节点
 * - 文本节点
 * - 元素节点
 * - 组件节点
 * - 函数式组件节点
 * - 克隆节点 
 * 
 * VNode 的作用
 * 
 * 我们在视图渲染之前, 写好的template模板先编译成VNode并缓存下来，
 * 等到数据发生变化页面需要重新渲染的时候， * 我们把数据发生变化后生成的VNode与前一次缓存下来的VNode进行对比，
 * 找出差异，然后有差异的VNode对应的真实DOM节点就是需要重新渲染的节点，
 * 最后根据有差异的VNode创建出真实的DOM节点再插入到视图中，最终完成一次视图更新
 */
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string, /*当前节点的标签名*/
    data?: VNodeData, 
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag            /*当前节点的标签名*/
    this.data = data           /*当前节点对应的对象，包含了具体的一些数据信息，是一个VNodeData类型，可以参考VNodeData类型中的数据信息*/
    this.children = children /*当前节点的子节点，是一个数组*/
    this.text = text         /*当前节点的文本*/
    this.elm = elm    /*当前虚拟节点对应的真实dom节点*/
    this.ns = undefined   /*当前节点的名字空间*/
    this.context = context    /*当前组件节点对应的Vue实例*/
    this.fnContext = undefined  /*函数式组件对应的Vue实例*/
    this.fnOptions = undefined  /** 函数组件的option选项 */
    this.fnScopeId = undefined
    this.key = data && data.key   /*节点的key属性，被当作节点的标志，用以优化*/
    this.componentOptions = componentOptions  /*组件的option选项，如组件的props等*/
    this.componentInstance = undefined        /*当前组件节点对应的 Vue 实例*/
    this.parent = undefined   /*当前节点的父节点*/
    this.raw = false     /*简而言之就是是否为原生HTML或只是普通文本，innerHTML的时候为true，textContent的时候为false*/ 
    this.isStatic = false   /*静态节点标志*/
    this.isRootInsert = true  /*是否作为跟节点插入*/
    this.isComment = false   /*是否为注释节点*/
    this.isCloned = false   /*是否为克隆节点*/
    this.isOnce = false /*是否有v-once指令*/
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}

/**
 * 注释节点, 只需要两个属性
 *  
 */
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text // 注释的文本
  node.isComment = true // 是注释节点
  return node
}

/**
 *  文件节点, 只需要文本就够了
 */
export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
// 它主要是为了做模板编译优化时使用
// 把 VNode 的属性复制一份, 唯一不同的就是 isCloned = true
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}

# example

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).

# Observer Dep
Observer (Watcher) 观察者
  - methods
    - update

Dep 被观察者
- props 
  - subs
  - id
- methods
  - addSub(Watcher)
  - removeSub(Watcher)
  - depend 添加 (调用 addSub)
  - notify 发布


/* istanbul ignore if */ 忽略某些代码的统计
hydrating 是与服务端渲染相关, 可以把他忽略不计
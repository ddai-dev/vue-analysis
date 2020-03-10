import Vue from 'vue'
import App from './App.vue'

new Vue({
  el: '#app',
  render(createElement) {
    return createElement('div', {
      attrs:{
        id: 'app'
      }
    }, this.message)
  },
  data(){
    return {
      message: 'Hello Vue!'
    }
  }
})

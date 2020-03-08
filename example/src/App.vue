<template>
  <div id="app">
   {{ msg }}
  </div>
</template>

<script>
export default {
  name: 'app',
  mounted(){
    console.log(this.msg)
  },
  data () {
    return {
      msg: 'Hello Vue !'
    }
  }
}
</script>

<style>
</style>

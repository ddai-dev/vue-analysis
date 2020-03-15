<template>
  <div>
  </div>
</template>
<script>
var mixin = {
  data: function() {
    return {
      message: "hello",
      foo: "abc"
    };
  },
  created: function () {
    console.log('混入对象的钩子被调用')
  }
};

export default {
  mixins: [mixin],
  components: {},
  data() {
    return {
      message: "goodbye",
      bar: "def"
    };
  },
  methods: {},
  created: function() {
    console.log(this.$data);
    // => { message: "goodbye", foo: "abc", bar: "def" }
  }
};
</script>
<template>
    <div>
        <slot></slot>
    </div>
</template>
<script>
    import { findComponentsDownward } from '../../utils/assist.js';
    import Emitter from '../../mixins/emitter.js';

    export default {
        name: 'iCheckboxGroup',
        mixins: [ Emitter ],
        props: {
            value: {
                type: Array,
                default () {
                    return [];
                }
            }
        },
        data () {
            return {
                currentValue: this.value,
                childrens: []
            };
        },
        methods: {
            updateModel (update) {
                this.childrens = findComponentsDownward(this, 'iCheckbox');
                if (this.childrens) {
                    const { value } = this;
                    this.childrens.forEach(child => {
                        child.model = value;

                        if (update) {
                            child.currentValue = value.indexOf(child.label) >= 0;
                            child.group = true;
                        }
                    });
                }
            },
            // 子元素的值修改, 来调用
            change (data) {
                this.currentValue = data;
                this.$emit('input', data);
                this.$emit('on-change', data);
                this.dispatch('iFormItem', 'on-form-change', data);
            }
        },
        mounted () {
            // 挂载时, 把 CheckboxGroup 的 value，赋值给 Checkbox 的 model
            this.updateModel(true);
        },
        watch: {
            value () {
                this.updateModel(true);
            }
        }
    };
</script>

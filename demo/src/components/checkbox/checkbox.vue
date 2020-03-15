<template>
    <label>
        <span>
            <input
                v-if="group"
                type="checkbox"
                :disabled="disabled"
                :value="label"
                v-model="model"
                @change="change">
            <input
                v-else
                type="checkbox"
                :disabled="disabled"
                :checked="currentValue"
                @change="change">
        </span>
        <slot></slot>
    </label>
</template>
<script>
    import { findComponentUpward } from '../../utils/assist.js';
    import Emitter from '../../mixins/emitter.js';

    export default {
        name: 'iCheckbox',
        mixins: [ Emitter ],
        props: {
            disabled: {
                type: Boolean,
                default: false
            },
            value: {
                type: [String, Number, Boolean],
                default: false
            },
            trueValue: {
                type: [String, Number, Boolean],
                default: true
            },
            falseValue: {
                type: [String, Number, Boolean],
                default: false
            },
            label: {
                type: [String, Number, Boolean]
            }
        },
        data () {
            return {
                currentValue: this.value,
                // 在父组件初始化时 mounted, 会把对应的 child.mode 设置上
                model: [],
                group: false,
                parent: null,
            };
        },
        mounted () {
            this.parent = findComponentUpward(this, 'iCheckboxGroup');

            if (this.parent) {
                this.group = true;
            }

            if (this.group) {
                this.parent.updateModel(true);
            } else {
                this.updateModel();
            }
        },
        methods: {
            change (event) {
                if (this.disabled) {
                    return false;
                }

                const checked = event.target.checked;
                this.currentValue = checked;

                const value = checked ? this.trueValue : this.falseValue;
                this.$emit('input', value);

                // 如果在组合模式下, 事件的派发由父元素来
                if (this.group) {
                    this.parent.change(this.model);
                } else {
                    this.$emit('on-change', value);
                    this.dispatch('iFormItem', 'on-form-change', value);
                }
            },
            updateModel () {
                this.currentValue = this.value === this.trueValue;
            },
        },
        watch: {
            value (val) {
                // 判断父元素修改的值, 是否合法
                if (val === this.trueValue || val === this.falseValue) {
                    this.updateModel();
                } else {
                    throw 'Value should be trueValue or falseValue.';
                }
            }
        }
    };
</script>

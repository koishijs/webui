<template>
  <transition name="el-zoom-in-top">
    <div ref="el" v-show="el" class="k-menu" :style="getStyle()">
      <template v-for="item of ctx.internal.menus[id]">
        <div class="k-menu-separator" v-if="item.id === '@separator'"></div>
        <menu-item v-else v-bind="{ prefix: id, ...item }"></menu-item>
      </template>
    </div>
  </transition>
</template>

<script lang="ts" setup>

import { ref } from 'vue'
import { useContext, ActiveMenu } from '@koishijs/client'
import MenuItem from './menu-item.vue'

const props = defineProps<ActiveMenu>()

const ctx = useContext()

const el = ref<HTMLElement>()

const getStyle = () => {
  if (!el.value) return {}
  const { height, width } = el.value.getBoundingClientRect()
  const style: any = {}
  if (props.relative.right + width > window.innerWidth) {
    style.right = `${window.innerWidth - props.relative.left}px`
  } else {
    style.left = `${props.relative.right}px`
  }
  if (props.relative.bottom + height > window.innerHeight) {
    style.bottom = `0px`
  } else {
    style.top = `${props.relative.bottom}px`
  }
  return style
}

</script>

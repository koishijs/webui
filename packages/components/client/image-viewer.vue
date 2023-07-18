<template>
  <div class="image-viewer" ref="container">
    <slot></slot>
    <span class="button bottom" @click.stop>
      <el-tooltip placement="top" content="缩小" :offset="20">
        <k-icon name="search-minus" @click="scale -= 0.2"/>
      </el-tooltip>
      <el-tooltip placement="top" content="放大" :offset="20">
        <k-icon name="search-plus" @click="scale += 0.2"/>
      </el-tooltip>
      <el-tooltip placement="top" content="复原" :offset="20">
        <k-icon name="expand" @click="scale = 1, rotate = 0"/>
      </el-tooltip>
      <el-tooltip placement="top" content="逆时针旋转" :offset="20">
        <k-icon name="undo" @click="rotate -= 90"/>
      </el-tooltip>
      <el-tooltip placement="top" content="逆时针旋转" :offset="20">
        <k-icon name="redo" @click="rotate += 90"/>
      </el-tooltip>
    </span>
    <img v-if="src" :key="src" ref="img" :style="{ transform }" :src="src"/>
  </div>
</template>

<script lang="ts" setup>

import { computed, watch, ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps<{
  src?: string
}>()

const scale = ref(1)
const rotate = ref(0)
const img = ref<HTMLImageElement>(null)
const container = ref<HTMLDivElement>(null)

const transform = computed(() => {
  return `scale(${scale.value}) rotate(${rotate.value}deg)`
})

watch(() => props.src, (el) => {
  scale.value = 1
  rotate.value = 0
})

watch(img, moveToCenter)

useResizeObserver(container, () => {
  moveToCenter(img.value)
})

function moveToCenter(el: HTMLImageElement) {
  if (!el) return
  const { naturalHeight, naturalWidth } = el
  const maxHeight = container.value.clientHeight
  const maxWidth = container.value.clientWidth
  const scale = Math.min(1, maxHeight / naturalHeight, maxWidth / naturalWidth)
  const width = naturalWidth * scale
  const height = naturalHeight * scale
  el.style.width = width + 'px'
  el.style.height = height + 'px'
  el.style.left = (maxWidth - width) / 2 + 'px'
  el.style.top = (maxHeight - height) / 2 + 'px'
}

</script>

<style lang="scss">

@use "sass:math";

$buttonSize: 3rem;
$buttonBg: #303133;

.overlay-enter-from, .overlay-leave-to {
  opacity: 0;
}

.overlay-enter, .overlay-leave {
  opacity: 1;
}

.image-viewer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .button {
    position: absolute;
    border-radius: $buttonSize;
    cursor: pointer;
    user-select: none;
    opacity: 0.5;
    font-size: math.div($buttonSize, 2);
    height: $buttonSize;
    background-color: $buttonBg;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    transition: 0.4s ease;

    .k-icon {
      transition: 0.4s ease;
      height: 1.25rem;
    }

    &:not(.disabled):hover {
      opacity: 0.8;
    }

    &:not(.disabled) .k-icon:hover {
      color: rgba(244, 244, 245, .8);
    }

    @each $tag in left, right {
      &.#{$tag} {
        top: 50%;
        z-index: 2000;
        transform: translateY(-50%);
        width: $buttonSize;
        #{$tag}: $buttonSize;
        .k-icon {
          margin-#{$tag}: -3px;
        }
      }
    }

    &.bottom {
      z-index: 2000;
      bottom: $buttonSize;
      width: $buttonSize * 6;
      left: 50%;
      transform: translateX(-50%);
    }

    &.disabled {
      cursor: not-allowed;
    }
  }

  img {
    position: absolute;
    transition: 0.3s ease;
  }
}

</style>

<template>
  <el-scrollbar ref="root" @scroll="onScroll" :max-height="maxHeight">
    <virtual-item v-if="$slots.header" @resize="virtual.saveSize('header', $event)">
      <div><slot name="header"></slot></div>
    </virtual-item>
    <component :is="tag" class="virtual-list-wrapper" :style="wrapperStyle">
      <virtual-item v-for="(item, index) in dataShown"
        @resize="virtual.saveSize(getKey(item), $event)">
        <slot v-bind="item" :index="index + range.start"></slot>
      </virtual-item>
    </component>
    <virtual-item v-if="$slots.footer" @resize="virtual.saveSize('footer', $event)">
      <div><slot name="footer"></slot></div>
    </virtual-item>
    <div ref="shepherd"></div>
  </el-scrollbar>
</template>

<script lang="ts" setup>

import { ref, computed, watch, nextTick, onActivated, onMounted, PropType } from 'vue'
import type { ElScrollbar } from 'element-plus'
import Virtual from './virtual'
import VirtualItem from './item'

const emit = defineEmits(['item-click', 'scroll', 'top', 'bottom', 'update:activeKey'])

const props = defineProps({
  keyName: { type: String, default: 'id' },
  data: { type: Array, required: true },
  count: { default: 50 },
  estimated: { default: 50 },
  tag: { default: 'div' },
  pinned: Boolean,
  activeKey: { default: '' },
  threshold: { default: 0 },
  maxHeight: String,
  activate: {
    type: String as PropType<'top' | 'bottom' | 'current'>,
    default: 'bottom',
  },
})

const dataShown = computed<any[]>(() => props.data.slice(range.start, range.end))

const root = ref<typeof ElScrollbar>()

watch(() => props.data.length, () => {
  const { scrollTop, clientHeight, scrollHeight } = root.value.wrapRef
  if (!props.pinned || Math.abs(scrollTop + clientHeight - scrollHeight) < 1) {
    nextTick(scrollToBottom)
  }
  virtual.updateUids(getUids())
  virtual.handleDataChange()
})

watch(() => props.activeKey, (value) => {
  if (!value) return
  emit('update:activeKey', null)
  scrollToUid(value, true)
})

const shepherd = ref<HTMLElement>()

const wrapperStyle = computed(() => {
  const { padFront, padBehind } = range
  return { padding: `${padFront}px 0px ${padBehind}px` }
})

const virtual = new Virtual({
  count: props.count,
  estimated: props.estimated,
  buffer: Math.floor(props.count / 3),
  uids: getUids(),
})

const range = virtual.range

function getUids() {
  return props.data.map(getKey)
}

function getKey(item: string) {
  const keys = props.keyName.split('.')
  return keys.reduce((obj, key) => obj[key], item)
}

onMounted(() => {
  if (props.activeKey) {
    scrollToUid(props.activeKey)
  } else {
    scrollToBottom()
  }
})

function scrollToOffset(offset: number, smooth = false) {
  if (smooth) {
    root.value.wrapRef.scrollTo({ top: offset, behavior: 'smooth' })
  } else {
    root.value.wrapRef.scrollTop = offset
  }
}

// set current scroll position to a expectant index
function scrollToUid(uid: string, smooth = false) {
  scrollToOffset(virtual.getUidOffset(uid), smooth)
}

function scrollToBottom() {
  if (shepherd.value) {
    const offset = shepherd.value.offsetTop
    scrollToOffset(offset)

    // check if it's really scrolled to the bottom
    // maybe list doesn't render and calculate to last range
    // so we need retry in next event loop until it really at bottom
    setTimeout(() => {
      const offset = Math.ceil(root.value.wrapRef.scrollTop)
      const clientLength = Math.ceil(root.value.wrapRef.clientHeight)
      const scrollLength = Math.ceil(root.value.wrapRef.scrollHeight)
      if (offset + clientLength < scrollLength) {
        scrollToBottom()
      }
    }, 3)
  }
}

let scrollTop = 0

onActivated(() => {
  if (props.activate === 'bottom') {
    scrollToBottom()
  } else if (props.activate === 'current') {
    root.value.setScrollTop(scrollTop)
  }
})

function onScroll(ev: MouseEvent) {
  const offset = Math.ceil(scrollTop = root.value.wrapRef.scrollTop)
  const clientLength = Math.ceil(root.value.wrapRef.clientHeight)
  const scrollLength = Math.ceil(root.value.wrapRef.scrollHeight)

  // iOS scroll-spring-back behavior will make direction mistake
  if (offset < 0 || (offset + clientLength > scrollLength + 1) || !scrollLength) {
    return
  }

  virtual.handleScroll(offset)
  emitEvent(offset, clientLength, scrollLength, ev)
}

function emitEvent(offset: number, clientLength: number, scrollLength: number, ev: MouseEvent) {
  emit('scroll', ev, virtual.range)
  if (virtual.direction < 0 && !!props.data.length && (offset - props.threshold <= 0)) {
    emit('top')
  } else if (virtual.direction > 0 && (offset + clientLength + props.threshold >= scrollLength)) {
    emit('bottom')
  }
}

</script>

<template>
  <div class="textarea">
    <input
      autocomplete="off"
      step="any"
      :value="text"
      :placeholder="placeholder"
      @input="onInput"
      @paste="onPaste"
      @keydown.enter.stop="onEnter"
    />
  </div>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { useEventListener } from '@vueuse/core'
import segment from '@satorijs/element'

const emit = defineEmits(['send', 'update:modelValue'])

const props = withDefaults(defineProps<{
  target?: HTMLElement | Document
  modelValue?: string
  placeholder?: string
}>(), {
  target: () => document,
  modelValue: '',
})

const text = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function onEnter() {
  if (!text.value) return
  emit('send', segment.escape(text.value))
  text.value = ''
}

function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value
}

function handleDataTransfer(event: Event, transfer: DataTransfer) {
  for (const item of transfer.items) {
    if (item.kind !== 'file') continue
    event.preventDefault()
    const file = item.getAsFile()
    const [type] = file.type.split('/', 1)
    if (!['image', 'audio', 'video'].includes(type)) {
      console.warn('Unsupported file type:', file.type)
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', function () {
      emit('send', segment(type, { url: reader.result }).toString())
    }, false)
    reader.readAsDataURL(file)
  }
}

useEventListener(props.target, 'drop', (event: DragEvent) => {
  handleDataTransfer(event, event.dataTransfer)
})

useEventListener(props.target, 'dragover', (event: DragEvent) => {
  event.preventDefault()
})

async function onPaste(event: ClipboardEvent) {
  handleDataTransfer(event, event.clipboardData)
}

</script>

<style lang="scss" scoped>

input {
  padding: 0;
  width: 100%;
  border: none;
  outline: none;
  font-size: 1em;
  height: inherit;
  color: inherit;
  display: inline-block;
  transition: 0.3s ease;
  box-sizing: border-box;
  background-color: transparent;
}

</style>

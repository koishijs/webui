<template>
  <el-dialog v-model="showUploading" destroy-on-close>
    请将文件拖动到窗口内以上传。
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="uploading = null">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { useEventListener } from '@vueuse/core'
import { arrayBufferToBase64, send } from '@koishijs/client'
import { uploading } from './store'

const showUploading = computed({
  get: () => !!uploading.value,
  set: (v) => uploading.value = null,
})

function handleDataTransfer(event: Event, transfer: DataTransfer) {
  const prefix = uploading.value
  for (const item of transfer.items) {
    if (item.kind !== 'file') continue
    event.preventDefault()
    const file = item.getAsFile()
    const reader = new FileReader()
    reader.addEventListener('load', function () {
      send('explorer/write', prefix + file.name, arrayBufferToBase64(reader.result as ArrayBuffer), true)
    }, false)
    reader.readAsArrayBuffer(file)
  }
  uploading.value = null
}

useEventListener('drop', (event: DragEvent) => {
  if (!uploading.value) return
  handleDataTransfer(event, event.dataTransfer)
})

useEventListener('paste', (event: ClipboardEvent) => {
  if (!uploading.value) return
  handleDataTransfer(event, event.clipboardData)
})

useEventListener('dragover', (event: DragEvent) => {
  if (!uploading.value) return
  event.preventDefault()
})

</script>

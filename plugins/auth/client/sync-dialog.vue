<template>
  <el-dialog
    class="sync-dialog"
    @close="config.sync ??= false"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    v-model="showSyncDialog">
    <p class="text-center">检测到你本地的配置与云端不同步，是否同步配置？</p>
    <el-button-group class="text-center">
      <el-button @click="setMode('upload')">上传当前配置</el-button>
      <el-button @click="setMode('download')">下载云端配置</el-button>
      <el-button @click="setMode()">关闭配置同步</el-button>
    </el-button-group>
  </el-dialog>
</template>

<script lang="ts" setup>

import { message, send, store, useConfig } from '@koishijs/client'
import { shared, showSyncDialog } from './utils'

const config = useConfig()

async function setMode(value?: 'upload' | 'download') {
  shared.value.sync = !!value
  showSyncDialog.value = false
  if (!value) return
  if (value === 'download') {
    config.value = store.user.config
    return
  }
  try {
    await send('user/update', { config: config.value })
  } catch (e) {
    message.error(e.message)
  }
}

</script>

<style lang="scss" scoped>

p.text-center {
  text-align: center;
}

.el-button-group.text-center {
  display: flex;
  justify-content: center;
}

</style>

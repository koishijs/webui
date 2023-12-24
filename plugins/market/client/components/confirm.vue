<template>
  <el-dialog v-if="store.market?.registry" v-model="showConfirm" class="confirm-panel" destroy-on-close>
    <template #header>确认安装</template>
    <table>
      <colgroup>
        <col width="auto">
        <col width="auto">
        <col width="1rem">
        <col width="auto">
      </colgroup>
      <thead>
        <tr>
          <th>依赖</th>
          <th>旧版本</th>
          <th></th>
          <th>新版本</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(value, key) in config.override" :key="key">
          <td>{{ key }}</td>
          <td>{{ store.dependencies?.[key]?.resolved || '未安装' }}</td>
          <td class="arrow"><span><k-icon name="arrow-right"></k-icon></span></td>
          <td>{{ value || '移除依赖' }}</td>
        </tr>
      </tbody>
    </table>
    <template #footer>
      <el-button @click="showConfirm = false">取消</el-button>
      <el-button type="danger" @click="clear">丢弃</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { store, useContext } from '@koishijs/client'
import { showConfirm, install } from './utils'
import { config } from '../utils'

const ctx = useContext()

function clear() {
  showConfirm.value = false
  config.value.override = {}
}

function confirm() {
  showConfirm.value = false
  return install(config.value.override, async () => {
    for (const [key, value] of Object.entries(config.value.override)) {
      if (!value) continue
      ctx.emit('config/dialog-fork', key, true)
    }
  })
}

</script>

<style lang="scss" scoped>

td.arrow {
  padding: 0;

  span {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

</style>

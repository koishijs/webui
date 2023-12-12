<template>
  <el-dialog v-if="store.market?.registry" v-model="showConfirm" class="confirm-panel" destroy-on-close>
    <template #header>确认安装</template>
    <table>
      <thead>
        <tr>
          <th>依赖</th>
          <th>旧版本</th>
          <th>新版本</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(value, key) in config.override" :key="key">
          <td>{{ key }}</td>
          <td>{{ store.dependencies?.[key]?.resolved || '未安装' }}</td>
          <td>{{ value || '移除依赖' }}</td>
        </tr>
      </tbody>
    </table>
    <template #footer>
      <el-button @click="showConfirm = false">取消</el-button>
      <el-button type="primary" @click="onEnter">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { store } from '@koishijs/client'
import { showConfirm, install } from './utils'
import { config } from '../utils'

function onEnter() {
  showConfirm.value = false
  return install(config.value.override)
}

</script>

<style lang="scss">

</style>

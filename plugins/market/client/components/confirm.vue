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
        <tr v-for="(version, name) in config.market.override" :key="name">
          <td>{{ name }}</td>
          <td>{{ store.dependencies?.[name]?.resolved || '未安装' }}</td>
          <td class="arrow"><span><k-icon name="arrow-right"></k-icon></span></td>
          <td>{{ version || '移除依赖' }}</td>
        </tr>
      </tbody>
    </table>
    <template #footer>
      <div class="left">
        <el-checkbox :disabled="!hasRemove" v-model="removeConfig">
          为新卸载的依赖删除配置
        </el-checkbox>
      </div>
      <div class="right">
        <el-button @click="showConfirm = false">取消</el-button>
        <el-button type="danger" @click="clear">丢弃改动</el-button>
        <el-button type="primary" @click="confirm">确认安装</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed, ref } from 'vue'
import { store, useContext, useConfig } from '@koishijs/client'
import { showConfirm, install } from './utils'

const ctx = useContext()
const config = useConfig()

const removeConfig = ref(config.value.market?.removeConfig)

function clear() {
  showConfirm.value = false
  config.value.market.override = {}
}

const hasRemove = computed(() => {
  return Object.values(config.value.market.override).some(version => !version)
})

function confirm() {
  showConfirm.value = false
  return install(config.value.market.override, async () => {
    for (const [name, value] of Object.entries(config.value.market.override)) {
      if (!value || store.dependencies?.[name]?.resolved) continue
      ctx.configWriter?.ensure(name, true)
    }
  })
}

</script>

<style lang="scss">

.confirm-panel {
  td.arrow {
    padding: 0;

    span {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .el-dialog__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

</style>

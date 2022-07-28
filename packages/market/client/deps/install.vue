<template>
  <el-dialog v-model="showDialog" custom-class="install-panel" @closed="active = ''">
    <template v-if="active" #header="{ titleId, titleClass }">
      <span :id="titleId" :class="[titleClass, '']">{{ active }} @</span>
      <el-button class="prefix right-adjacent" @click="config.prefix = transition[config.prefix]">{{ config.prefix || '=' }}</el-button>
      <el-select :disabled="workspace" class="left-adjacent" v-model="version">
        <el-option v-for="({ result }, version) in data" :key="version" :value="version">
          {{ version }}
          <span :class="[result, 'theme-color', 'dot-hint']"></span>
        </el-option>
      </el-select>
    </template>

    <table v-if="active && !workspace">
      <tr>
        <td>依赖名称</td>
        <td>版本区间</td>
        <td>当前版本</td>
        <td>可用性</td>
      </tr>
      <tr v-for="({ request, resolved, result }, name) in data[version].peers" :key="name">
        <td class="name">{{ name }}</td>
        <td>{{ request }}</td>
        <td>{{ resolved }}</td>
        <td :class="['theme-color', result]">
          <span v-if="result === 'warning'"><k-icon name="exclamation-full"></k-icon>未下载</span>
          <span v-else-if="result === 'success'"><k-icon name="check-full"></k-icon>已下载</span>
          <span v-else><k-icon name="times-full"></k-icon>不兼容</span>
        </td>
      </tr>
    </table>

    <div v-if="workspace">
      这是一个工作区插件。
    </div>

    <template v-if="active" #footer>
      <el-button @click="showDialog = false">取消</el-button>
      <el-button :type="data[version].result" @click="showDialog = false">安装</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'
import { store, valueMap } from '@koishijs/client'
import { satisfies } from 'semver'
import { config, active } from '../utils'

const transition = { '': '^', '^': '~', '~': '' }

const showDialog = ref(false)

const version = ref<string>()

const workspace = computed(() => {
  return store.packages?.[active.value]?.workspace
})

const data = computed(() => {
  if (!active.value) return
  return valueMap(store.market.data[active.value].versions, (item) => {
    const peers = valueMap({ ...item.peerDependencies }, (request, name) => {
      const resolved = store.dependencies[name]?.resolved || store.packages[name]?.version
      const result = !resolved ? 'warning' : satisfies(resolved, request) ? 'success' : 'danger'
      return { request, resolved, result }
    })
    let result: 'success' | 'warning' | 'danger' = 'success'
    for (const peer of Object.values(peers)) {
      if (peer.result === 'danger') {
        result = 'danger'
        break
      }
      if (result === 'warning') {
        result = 'warning'
      }
    }
    return { peers, result }
  })
})

watch(() => active.value, (value) => {
  showDialog.value = !!value
  if (!value) return
  version.value = store.market.data[value].version
}, { immediate: true })

</script>

<style lang="scss">

.install-panel {
  .el-dialog__title {
    font-weight: 500;
    color: var(--fg1);
    margin-right: 0.5rem;
  }

  .version-badges {
    float: right;
    margin-right: -12px;
  }

  td.name {
    text-align: left;
  }

  td.theme-color span {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  $prefix-size: 2rem;

  .el-button.prefix {
    width: $prefix-size;
    height: $prefix-size;
    vertical-align: bottom;
    padding: 0;
  }

  .el-button + .el-button {
    margin-left: 1rem;
  }
}

.dot-hint::before {
  content: '';
  position: absolute;
  border-radius: 100%;
  width: 0.5rem;
  height: 0.5rem;
  top: 50%;
  right: 20px;
  transform: translate(0, -50%);
  background-color: currentColor;
  transition: background-color 0.3s ease;
  box-shadow: 1px 1px 2px #3333;
}

</style>

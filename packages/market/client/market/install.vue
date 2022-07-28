<template>
  <el-dialog v-model="showDialog" custom-class="install-panel" @closed="emit('update:modelValue')">
    <template #header="{ titleId, titleClass }">
      <span :id="titleId" :class="[titleClass, '']">{{ modelValue }} @</span>
      <el-select v-if="data" v-model="version">
        <el-option v-for="(_, version) in data.versions" :key="version" :value="version">
          {{ version }}
          <span class="version-badges">
            <span v-if="version.endsWith('0')">存在问题</span>
          </span>
        </el-option>
      </el-select>
    </template>

    <table>
      <tr>
        <td>依赖名称</td>
        <td>版本区间</td>
        <td>可用性</td>
      </tr>
      <tr v-for="(range, name) in peerDependencies" :key="name">
        <td>{{ name }}</td>
        <td>{{ range }}</td>
        <td v-if="name === 'koishi'"><k-icon name="check-full"></k-icon>已下载</td>
        <td v-else><k-icon name="times-full"></k-icon>不兼容</td>
      </tr>
    </table>

    <template #footer>
      <k-button @click="showDialog = false">取消</k-button>
      <k-button solid @click="showDialog = false">安装</k-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'
import { store } from '@koishijs/client'

const emit = defineEmits(['update:modelValue'])

const props = defineProps<{
  modelValue?: string
}>()

const showDialog = ref(false)

const version = ref<string>()

const data = computed(() => store.market.data[props.modelValue])

const current = computed(() => data.value?.versions[version.value])

const peerDependencies = computed(() => ({ ...current.value?.peerDependencies }))

watch(() => props.modelValue, (value) => {
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
}

</style>

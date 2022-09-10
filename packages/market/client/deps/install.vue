<template>
  <el-dialog v-model="showDialog" custom-class="install-panel" @closed="active = ''">
    <template v-if="active" #header="{ titleId, titleClass }">
      <span :id="titleId" :class="[titleClass, '']">
        {{ active.replace(/(koishi-|^@koishijs\/)plugin-/, '') + (workspace ? ' (工作区)' : '') }}
      </span>
      <el-select v-if="!workspace" :disabled="workspace" v-model="selectVersion">
        <el-option v-for="({ result }, version) in data" :key="version" :value="version">
          {{ version }}
          <template v-if="version === current">(当前版本)</template>
          <span :class="[result, 'theme-color', 'dot-hint']"></span>
        </el-option>
      </el-select>
    </template>

    <el-scrollbar v-if="active && !workspace">
      <table>
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
    </el-scrollbar>

    <div v-if="local && paths.length">
      点击以前往配置页面：
      <ul>
        <li v-for="([path, active]) of paths" :key="path">
          <span class="link" @click.stop="configure(path)">{{ path }}</span>
          ({{ active ? '运行中' : '闲置' }})
        </li>
        <li v-if="!store.packages?.[active]?.id">
          <span class="link" @click.stop="configure(true)">添加新配置</span>
        </li>
      </ul>
    </div>
    <div v-else-if="local">
      <span class="link" @click.stop="configure(true)">你尚未配置此插件，点击立即配置。</span>
    </div>

    <template v-if="active" #footer>
      <div class="left"></div>
      <div class="right">
        <el-button @click="showDialog = false">取消</el-button>
        <template v-if="!workspace">
          <el-button :type="data[version].result" @click="install(false)" :disabled="unchanged">
            {{ current ? '更新' : '安装' }}
          </el-button>
        </template>
        <template v-else-if="current">
          <el-button @click="install(true)">移除</el-button>
          <el-button v-if="!workspace" @click="install(false)" :disabled="unchanged">修改</el-button>
        </template>
        <template v-else>
          <el-button @click="install(true)" :disabled="unchanged">添加</el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

import { computed, ref, watch } from 'vue'
import { loading, message, router, send, socket, store, valueMap } from '@koishijs/client'
import { satisfies } from 'semver'
import { active } from '../utils'

const showDialog = ref(false)

async function install(remove = false) {
  const instance = loading({
    text: '正在更新依赖……',
  })
  const dispose = watch(socket, () => {
    message.success('安装成功！')
    dispose()
    instance.close()
  })
  try {
    showDialog.value = false
    const code = await send('market/install', {
      [active.value]: remove ? null : version.value,
    })
    if (code) {
      message.error('安装失败！')
    } else {
      message.success('安装成功！')
      if (!paths.value.length) {
        const path = shortname.value + ':' + Math.random().toString(36).slice(2, 8)
        send('manager/unload', path, {})
      }
    }
  } catch (err) {
    message.error('安装超时！')
  } finally {
    dispose()
    instance.close()
  }
}

const version = ref<string>()

const selectVersion = computed({
  get() {
    if (store.dependencies[active.value]?.request === version.value) {
      return version.value + ' (当前版本)'
    } else {
      return version.value
    }
  },
  set(value) {
    version.value = value
  },
})

const unchanged = computed(() => version.value === store.dependencies[active.value]?.request)

const current = computed(() => store.dependencies[active.value]?.resolved)

const local = computed(() => store.packages?.[active.value])

const workspace = computed(() => {
  // workspace plugins:     dependencies ? packages √
  // workspace non-plugins: dependencies √ packages ×
  return store.dependencies[active.value]?.workspace || local.value?.workspace
})

const data = computed(() => {
  if (!active.value || workspace.value) return
  const { versions } = store.market.data[active.value] || store.dependencies[active.value]
  return valueMap(versions, (item) => {
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
  const request = store.dependencies[active.value]?.request
  version.value = request || store.market.data[value].version
}, { immediate: true })

function* find(target: string, plugins: {}, prefix: string): IterableIterator<[string, boolean]> {
  for (let key in plugins) {
    const config = plugins[key]
    const active = !key.startsWith('~')
    if (!active) key = key.slice(1)
    const request = key.split(':')[0]
    if (request === target) yield [prefix + key, active]
    if (request === 'group') {
      yield* find(target, config, prefix + key + '/')
    }
  }
}

const shortname = computed(() => active.value.replace(/(koishi-|^@koishijs\/)plugin-/, ''))

const paths = computed(() => [...find(shortname.value, store.config.plugins, '')])

function configure(path: string | true) {
  showDialog.value = false
  if (path === true) {
    path = shortname.value + ':' + Math.random().toString(36).slice(2, 8)
    send('manager/unload', path, {})
  }
  router.push('/plugins/' + path)
}

</script>

<style lang="scss">

.install-panel {
  .el-dialog__header {
    display: flex;
    gap: 0 0.5em;
    align-items: center;
    padding-right: 36px;

    .el-dialog__title {
      font-weight: 500;
      color: var(--fg1);
      margin-right: 0.5rem;
      flex: 0 0 auto;
    }

    .el-select {
      flex: 1 1 auto;
      max-width: 12.5rem;
      margin: -2px 0 -4px;
    }
  }

  .version-badges {
    float: right;
    margin-right: -12px;
  }

  .el-dialog__body {
    padding: 0 20px;
    min-height: 40px;

    > div {
      margin: 1rem 0;
    }
  }

  table {
    td, th {
      padding: 0.5em 0.875em;
      white-space: nowrap;
    }
  }

  td.name {
    text-align: left;
  }

  td.theme-color span {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  span.link {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }

  .el-button + .el-button {
    margin-left: 1rem;
  }

  .el-dialog__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

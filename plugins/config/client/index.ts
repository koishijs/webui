import { Context, router, send, Service } from '@koishijs/client'
import { defineComponent, h, resolveComponent } from 'vue'
import type {} from '@koishijs/plugin-config'
import { dialogFork, plugins, type } from './components/utils'
import Settings from './components/index.vue'
import Forks from './components/forks.vue'
import Select from './components/select.vue'

import './index.scss'
import './icons'

export * from './components/utils'

declare module '@koishijs/client' {
  interface Context {
    configWriter: ConfigWriter
  }
}

export default class ConfigWriter extends Service {
  constructor(ctx: Context) {
    super(ctx, 'configWriter', true)

    ctx.slot({
      type: 'global',
      component: defineComponent(() => () => {
        return h(resolveComponent('k-slot'), { name: 'plugin-select', single: true })
      }),
    })

    ctx.slot({
      type: 'plugin-select-base',
      component: Select,
      order: -1000,
    })

    ctx.slot({
      type: 'plugin-select',
      component: Select,
      order: -1000,
    })

    ctx.slot({
      type: 'global',
      component: Forks,
    })

    ctx.page({
      path: '/plugins/:name*',
      name: '插件配置',
      icon: 'activity:plugin',
      order: 800,
      authority: 4,
      fields: ['config', 'packages', 'services'],
      component: Settings,
    })

    ctx.menu('config.tree', [{
      id: 'config.tree.toggle',
      type: ({ config }) => config.tree?.disabled ? '' : type.value,
      icon: ({ config }) => config.tree?.disabled ? 'play' : 'stop',
      label: ({ config }) => (config.tree?.disabled ? '启用' : '停用')
        + (config.tree?.name === 'group' ? '分组' : '插件'),
    }, {
      id: '.save',
      icon: ({ config }) => config.tree?.disabled ? 'save' : 'check',
      label: ({ config }) => config.tree?.disabled ? '保存配置' : '重载配置',
    }, {
      id: '@separator',
    }, {
      id: '.rename',
      icon: 'edit',
      label: '重命名',
    }, {
      id: '.remove',
      type: 'danger',
      icon: 'delete',
      label: ({ config }) => config.tree?.children ? '移除分组' : '移除插件',
    }, {
      id: '@separator',
    }, {
      id: '.clone',
      icon: 'clone',
      label: '克隆配置',
    }, {
      id: '.manage',
      icon: 'manage',
      label: '管理多份配置',
    }, {
      id: '.add-plugin',
      icon: 'add-plugin',
      label: '添加插件',
    }, {
      id: '.add-group',
      icon: 'add-group',
      label: '添加分组',
    }])
  }

  ensure(name: string, passive?: boolean) {
    const shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    const forks = plugins.value.forks[shortname]
    if (!forks?.length) {
      const key = Math.random().toString(36).slice(2, 8)
      send('manager/unload', '', shortname + ':' + key, {})
      if (!passive) router.push('/plugins/' + key)
    } else if (forks.length === 1) {
      if (!passive) router.push('/plugins/' + forks[0])
    } else {
      if (!passive) dialogFork.value = name
    }
  }

  remove(name: string) {
    const shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    const forks = plugins.value.forks[shortname]
    for (const id of forks) {
      const tree = plugins.value.paths[id]
      send('manager/remove', tree.parent?.path ?? '', tree.id)
    }
  }

  get(name: string) {
    const shortname = name.replace(/(koishi-|^@koishijs\/)plugin-/, '')
    return plugins.value.forks[shortname]?.map(id => plugins.value.paths[id])
  }
}

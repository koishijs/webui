import { Context } from '@koishijs/client'
import { defineComponent, h, resolveComponent } from 'vue'
import type {} from '@koishijs/plugin-config'
import { type } from './components/utils'
import Settings from './components/index.vue'
import Select from './components/select.vue'
import './icons'

export * from './components/utils'

export default (ctx: Context) => {
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
    id: '.toggle',
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
    id: '.add-plugin',
    icon: 'add-plugin',
    label: '添加插件',
  }, {
    id: '.add-group',
    icon: 'add-group',
    label: '添加分组',
  }])
}

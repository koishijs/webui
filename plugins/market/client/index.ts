import { defineComponent, h } from 'vue'
import { Context, global, receive, router, send, store } from '@koishijs/client'
import type {} from '@koishijs/plugin-market'
import extensions from './extensions'
import Dependencies from './components/dependencies.vue'
import Install from './components/install.vue'
import Market from './components/market.vue'
import Progress from './components/progress.vue'
import './icons'

receive('market/patch', (data) => {
  store.market = {
    ...data,
    data: {
      ...store.market?.data,
      ...data.data,
    },
  }
})

receive('market/registry', (data) => {
  store.registry = {
    ...store.registry,
    ...data,
  }
})

export default (ctx: Context) => {
  ctx.plugin(extensions)

  ctx.slot({
    type: 'welcome-choice',
    component: defineComponent(() => () => h('div', {
      class: 'choice',
      onClick: () => router.push('/market'),
    }, [
      h('h2', '浏览插件'),
      h('p', '浏览插件市场中的插件，并根据自己的需要安装和配置。'),
    ])),
  })

  ctx.slot({
    type: 'global',
    component: Install,
  })

  ctx.page({
    id: 'market',
    path: '/market',
    name: '插件市场',
    icon: 'activity:market',
    order: 750,
    authority: 4,
    component: Market,
  })

  if (!global.static) {
    ctx.slot({
      type: 'status-right',
      component: Progress,
      order: 10,
    })

    ctx.page({
      path: '/dependencies',
      name: '依赖管理',
      icon: 'activity:deps',
      order: 700,
      authority: 4,
      fields: ['dependencies', 'registry'],
      component: Dependencies,
    })
  }

  ctx.action('market.refresh', {
    shortcut: 'ctrl+r',
    action: (scope) => send('market/refresh'),
  })

  ctx.menu('market', [{
    id: '.refresh',
    icon: 'refresh',
    label: '刷新',
    type: () => !store.market || store.market.progress < store.market.total ? 'spin disabled' : '',
  }])

  ctx.menu('dependencies', [{
    id: '.upgrade',
    icon: 'rocket',
    label: '全部更新',
  }, {
    id: '.install',
    icon: 'check',
    label: '应用更改',
  }, {
    id: '.manual',
    icon: 'add',
    label: '手动添加',
  }, {
    id: 'market.refresh',
    icon: 'refresh',
    label: '刷新',
    type: () => !store.market || store.market.progress < store.market.total ? 'spin disabled' : '',
  }])
}

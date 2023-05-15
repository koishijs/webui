import { defineComponent, h } from 'vue'
import { Context, global, receive, router, store } from '@koishijs/client'
import type {} from '@koishijs/plugin-market'
import Install from './deps/install.vue'
import Dependencies from './deps/index.vue'
import SettingsInfo from './deps/info.vue'
import Market from './market/index.vue'
import Progress from './market/progress.vue'
import './icons'
import './index.scss'

receive('market/patch', (data) => {
  store.market = {
    ...data,
    data: {
      ...store.market?.data,
      ...data.data,
    },
  }
})

export default (ctx: Context) => {
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

  ctx.slot({
    type: 'market-settings',
    component: SettingsInfo,
    order: 1000,
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
      fields: ['dependencies'],
      component: Dependencies,
    })
  }
}

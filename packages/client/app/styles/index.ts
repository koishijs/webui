import { Context } from '@koishijs/client'

import './index.scss'

export default function (ctx: Context) {
  ctx.theme({
    id: 'default-light',
    name: 'Default Light',
  })

  ctx.theme({
    id: 'default-dark',
    name: 'Default Dark',
  })

  ctx.theme({
    id: 'hc-light',
    name: 'High Contrast Light',
  })

  ctx.theme({
    id: 'hc-dark',
    name: 'High Contrast Dark',
  })
}

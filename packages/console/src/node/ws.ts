import { Context, Dict, WebSocketLayer } from 'koishi'
import { DataService, SocketHandle } from '../shared'

class WsService extends DataService {
  readonly handles: Dict<SocketHandle> = {}
  readonly layer: WebSocketLayer

  constructor(public ctx: Context, private config: WsService.Config) {
    super(ctx, 'ws', { immediate: true })

    this.layer = ctx.router.ws(config.apiPath, (socket) => {
      // eslint-disable-next-line no-new
      new SocketHandle(ctx, socket)
    })
  }

  stop() {
    this.layer.close()
  }
}

namespace WsService {
  export interface Config {
    selfUrl?: string
    apiPath?: string
  }
}

export default WsService

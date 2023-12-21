import { Context, Schema, Service } from 'koishi'

class Notifier extends Service {
  constructor(ctx: Context, public config: Notifier.Config) {
    super(ctx, 'notifier', true)
  }
}

namespace Notifier {
  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default Notifier

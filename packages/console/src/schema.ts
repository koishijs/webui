import { Context, Dict, Schema } from 'koishi'
import { DataService } from './service'

export class SchemaProvider extends DataService<Dict<Schema>> {
  constructor(ctx: Context) {
    super(ctx, 'schema', { immediate: true })

    ctx.on('internal/schema', () => this.refresh())
  }

  async get() {
    return this.ctx.schema._data
  }
}

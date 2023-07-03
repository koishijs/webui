import { clone, Context, Dict, Driver, Field, makeArray, Model, Schema } from 'koishi'
import { DataService } from '@koishijs/plugin-console'
import { resolve } from 'path'
import { deserialize, serialize } from './utils'

export * from './utils'

export type Methods = 'get' | 'set' | 'eval' | 'create' | 'remove' | 'upsert' | 'drop' | 'stats'

export type DbEvents = {
  [M in Methods as `database/${M}`]: (...args: string[]) => Promise<string>
}

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      database: DatabaseProvider
    }
  }

  interface Events extends DbEvents {}
}

export interface TableInfo extends Driver.TableStats, Model.Config<any> {
  fields: Field.Config
  primary: string[]
}

export interface DatabaseInfo extends Driver.Stats {
  tables: Dict<TableInfo>
}

class DatabaseProvider extends DataService<DatabaseInfo> {
  static filter = false
  static using = ['console', 'database']

  task: Promise<DatabaseInfo>

  addListener<K extends Methods>(name: K, refresh = false) {
    this.ctx.console.addListener(`database/${name}`, async (...args) => {
      const result = await (this.ctx.database[name] as any)(...args.map(deserialize))
      if (refresh) this.refresh()
      return result === undefined ? result : serialize(result)
    }, { authority: 4 })
  }

  constructor(ctx: Context) {
    super(ctx, 'database', { authority: 4 })

    ctx.console.addEntry(process.env.KOISHI_BASE ? [
      process.env.KOISHI_BASE + '/dist/index.js',
      process.env.KOISHI_BASE + '/dist/style.css',
    ] : process.env.KOISHI_ENV === 'browser' ? [
      // @ts-ignore
      import.meta.url.replace(/\/src\/[^/]+$/, '/client/index.ts'),
    ] : {
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })

    this.addListener('create', true)
    this.addListener('eval', true)
    this.addListener('get')
    this.addListener('remove', true)
    this.addListener('set')
    this.addListener('stats')
    this.addListener('upsert', true)

    ctx.on('model', () => this.refresh())
  }

  async getInfo() {
    const stats = await this.ctx.database.stats()
    const result = { tables: {}, ...stats } as DatabaseInfo
    const tableStats = result.tables
    result.tables = {}
    for (const name in this.ctx.model.tables) {
      result.tables[name] = {
        ...clone(this.ctx.model.tables[name]),
        ...tableStats[name],
      }
      result.tables[name].primary = makeArray(result.tables[name].primary)
      for (const [key, field] of Object.entries(result.tables[name].fields)) {
        if (field.deprecated) delete result.tables[name].fields[key]
      }
    }
    result.tables = Object.fromEntries(Object.entries(result.tables).sort(([a], [b]) => a.localeCompare(b)))
    return result
  }

  get(forced = false) {
    if (forced) delete this.task
    return this.task ||= this.getInfo()
  }
}

namespace DatabaseProvider {
  export interface Config {}

  export const Config: Schema<Config> = Schema.object({})
}

export default DatabaseProvider

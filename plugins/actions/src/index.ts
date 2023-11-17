import { Context, Schema } from 'koishi'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {}

#!/usr/bin/env node

import { cac } from 'cac'
import { resolve } from 'path'
import { build } from '.'
import { version } from '../package.json'

const cli = cac('koishi-console').help().version(version)

cli.command('build [root]')
  .action((root) => {
    root = resolve(process.cwd(), root || '.')
    build(root)
  })

cli.parse()

if (!cli.matchedCommand) {
  cli.outputHelp()
}

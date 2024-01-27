import CAC from 'cac'
import { resolve } from 'path'
import { build } from '.'

const { version } = require('../package.json')

const cli = CAC('koishi-console').help().version(version)

cli.command('build [root]')
  .action((root) => {
    root = resolve(process.cwd(), root || '.')
    build(root)
  })

cli.parse()

if (!cli.matchedCommand) {
  cli.outputHelp()
}

import { FileHandle, open } from 'fs/promises'
import { Logger } from 'koishi'
import { Buffer } from 'buffer'

export class FileWriter {
  public data: Logger.Record[]
  public task: Promise<FileHandle>
  public size: number

  private temp: Logger.Record[] = []

  constructor(public date: string, public path: string) {
    this.task = open(path, 'a+').then(async (handle) => {
      const buffer = await handle.readFile()
      this.data = this.parse(new TextDecoder().decode(buffer))
      this.size = buffer.byteLength
      return handle
    })
    this.task.then(() => this.flush())
  }

  flush() {
    if (!this.temp.length) return
    this.task = this.task.then(async (handle) => {
      const content = Buffer.from(this.temp.map((record) => JSON.stringify(record) + '\n').join(''))
      this.data.push(...this.temp)
      this.temp = []
      await handle.write(content)
      this.size += content.byteLength
      return handle
    })
  }

  parse(text: string) {
    return text.split('\n').map((line) => {
      try {
        return JSON.parse(line)
      } catch {}
    }).filter(Boolean)
  }

  async read() {
    await this.task
    return this.data
  }

  write(record: Logger.Record) {
    this.temp.push(record)
    this.flush()
  }

  async close() {
    const handle = await this.task
    await handle.close()
  }
}

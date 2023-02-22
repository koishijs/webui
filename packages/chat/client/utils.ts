import { useStorage } from '@koishijs/client'
import { Message } from '../src'

interface Data {
  messages: Message[]
}

export const data = useStorage<Data>('chat', 2, () => ({
  messages: [],
}))

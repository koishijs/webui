import { Universal } from '@koishijs/client'

export function getStatus(status: Universal.Status) {
  switch (status) {
    case Universal.Status.OFFLINE: return 'offline'
    case Universal.Status.ONLINE: return 'online'
    case Universal.Status.CONNECT: return 'connect'
    case Universal.Status.DISCONNECT: return 'disconnect'
    case Universal.Status.RECONNECT: return 'reconnect'
  }
}

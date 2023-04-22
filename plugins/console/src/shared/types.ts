export namespace AbstractWebSocket {
  export interface EventMap {
    open: AbstractWebSocket.Event
    error: AbstractWebSocket.Event
    message: AbstractWebSocket.MessageEvent
    close: AbstractWebSocket.CloseEvent
  }

  export interface EventListener {
    (event: Event): void
  }

  export interface Event {
    type: string
    target: AbstractWebSocket
  }

  export interface CloseEvent extends Event {
    code: number
    reason: string
  }

  export interface MessageEvent extends Event {
    data: string
  }
}

export interface AbstractWebSocket {
  close(code?: number, reason?: string): void
  send(data: string): void
  dispatchEvent(event: any): boolean
  addEventListener<K extends keyof AbstractWebSocket.EventMap>(type: K, listener: (event: AbstractWebSocket.EventMap[K]) => void): void
  removeEventListener<K extends keyof AbstractWebSocket.EventMap>(type: K, listener: (event: AbstractWebSocket.EventMap[K]) => void): void
}

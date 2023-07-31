import { Activity, Dict } from '@koishijs/client'

declare module '@koishijs/client' {
  interface ActionContext {
    'theme.activity': Activity
  }

  interface Config {
    activities: Dict<ActivityOverride>
  }
}

interface ActivityOverride {
  hidden?: boolean
  parent?: string
  order?: number
  position?: 'top' | 'bottom'
}

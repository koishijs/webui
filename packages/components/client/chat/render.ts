import segment from '@satorijs/element'
import { FunctionalComponent, h } from 'vue'

const inline = ['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'del', 'code']

const render: FunctionalComponent<segment[]> = (elements, ctx) => {
  return elements.map(({ type, attrs, children }) => {
    if (type === 'text') {
      return attrs.content
    } else if (type === 'at') {
      return h('span', `@${attrs.name}`)
    } else if (type === 'image') {
      return h('img', { src: attrs.url })
    } else if (type === 'audio') {
      return h('audio', { src: attrs.url, controls: true })
    } else if (type === 'video') {
      return h('video', { src: attrs.url, controls: true })
    } else if (inline.includes(type)) {
      return h(type, render(children, ctx))
    } else if (type === 'spl') {
      return h('span', { class: 'spoiler' }, render(children, ctx))
    } else if (type === 'p' || type === 'message') {
      return h('p', render(children, ctx))
    } else if (type === 'iframe') {
      return h('iframe', { innerHTML: attrs.content })
    } else {
      return render(children, ctx)
    }
  })
}

export default render

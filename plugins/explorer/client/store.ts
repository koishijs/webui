import { Dict, store } from '@koishijs/client'
import { Directive, reactive, watch } from 'vue'
import { Entry } from '@koishijs/plugin-explorer'

export const files = reactive<Dict<Entry>>({})

watch(() => store.explorer, () => {
  const oldFiles = { ...files }
  function traverse(entries: Entry[], prefix = '/') {
    if (!entries) return
    for (const entry of entries) {
      entry.filename = prefix + entry.name
      files[entry.filename] = entry
      delete oldFiles[entry.filename]
      traverse(entry.children, entry.filename + '/')
    }
  }
  traverse(store.explorer)
  for (const filename in oldFiles) {
    delete files[filename]
  }
}, { immediate: true })

export const vFocus: Directive = {
  mounted: (el) => el.focus(),
}

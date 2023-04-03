import { shallowRef } from 'vue'

import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

declare global {
  interface Window {
    monaco: typeof monaco
  }
}

window.monaco = monaco

window.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    if (label === 'json') return new JsonWorker()
    if (label === 'css') return new CssWorker()
    if (label === 'html') return new HtmlWorker()
    return new EditorWorker()
  },
}

export const model = monaco.editor.createModel('')

export const language = shallowRef(monaco.languages.getLanguages()[0])

model.onDidChangeLanguage((e) => {
  language.value = monaco.languages.getLanguages().find(x => x.id === e.newLanguage)
})

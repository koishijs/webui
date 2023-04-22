import { shallowRef } from 'vue'

import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
// import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

declare global {
  interface Window {
    monaco: typeof monaco
  }
}

window.monaco = monaco

window.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    // if (label === 'typescript' || label === 'javascript') return new TsWorker()
    // if (label === 'json') return new JsonWorker()
    // if (label === 'css') return new CssWorker()
    // if (label === 'html') return new HtmlWorker()
    return new EditorWorker()
  },
}

export const model = monaco.editor.createModel('')

const { cssDefaults, lessDefaults, scssDefaults } = monaco.languages.css
for (const service of [cssDefaults, lessDefaults, scssDefaults]) {
  service.setModeConfiguration({
    completionItems: false,
    hovers: false,
    documentSymbols: false,
    definitions: false,
    references: false,
    documentHighlights: false,
    rename: false,
    colors: false,
    foldingRanges: false,
    diagnostics: false,
    selectionRanges: false,
    documentFormattingEdits: false,
    documentRangeFormattingEdits: false,
  })
}

const { jsonDefaults } = monaco.languages.json
for (const service of [jsonDefaults]) {
  service.setModeConfiguration({
    documentFormattingEdits: false,
    documentRangeFormattingEdits: false,
    completionItems: false,
    hovers: false,
    documentSymbols: false,
    tokens: true,
    colors: false,
    foldingRanges: false,
    diagnostics: false,
    selectionRanges: false,
  })
}

const { javascriptDefaults, typescriptDefaults } = monaco.languages.typescript
for (const service of [javascriptDefaults, typescriptDefaults]) {
  service.setModeConfiguration({
    completionItems: false,
    hovers: false,
    documentSymbols: false,
    definitions: false,
    references: false,
    documentHighlights: false,
    rename: false,
    diagnostics: false,
    documentRangeFormattingEdits: false,
    signatureHelp: false,
    onTypeFormattingEdits: false,
    codeActions: false,
    inlayHints: false,
  })
}

const { htmlDefaults, handlebarDefaults, razorDefaults } = monaco.languages.html
for (const service of [htmlDefaults, handlebarDefaults, razorDefaults]) {
  service.setModeConfiguration({
    completionItems: false,
    hovers: false,
    documentSymbols: false,
    links: false,
    documentHighlights: false,
    rename: false,
    colors: false,
    foldingRanges: false,
    diagnostics: false,
    selectionRanges: false,
    documentFormattingEdits: false,
    documentRangeFormattingEdits: false,
  })
}

export const language = shallowRef(monaco.languages.getLanguages()[0])

model.onDidChangeLanguage((e) => {
  language.value = monaco.languages.getLanguages().find(x => x.id === e.newLanguage)
})

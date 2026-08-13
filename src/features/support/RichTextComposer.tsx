import { useEffect, useRef } from 'react'
import { sanitizeSupportMarkup } from './rich-text'

type RichTextComposerProps = {
  value: string
  onChange: (value: string) => void
}

export function RichTextComposer({ value, onChange }: RichTextComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value
  }, [value])

  function syncValue() {
    onChange(sanitizeSupportMarkup(editorRef.current?.innerHTML ?? ''))
  }

  function applyFormat(command: 'bold' | 'italic' | 'underline') {
    editorRef.current?.focus()
    if (typeof document.execCommand === 'function') document.execCommand(command)
    syncValue()
  }

  return <div className="rich-composer">
    <div aria-label="Formatação da mensagem" className="rich-toolbar" role="toolbar">
      <button aria-label="Negrito" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('bold')} title="Negrito" type="button"><strong>B</strong></button>
      <button aria-label="Itálico" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('italic')} title="Itálico" type="button"><em>I</em></button>
      <button aria-label="Sublinhar" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('underline')} title="Sublinhar" type="button"><u>U</u></button>
    </div>
    <div aria-label="Mensagem" className="rich-editor" contentEditable data-placeholder="Descreva o que aconteceu, o que você esperava e, se possível, como reproduzir o problema." onInput={syncValue} ref={editorRef} role="textbox" suppressContentEditableWarning />
  </div>
}

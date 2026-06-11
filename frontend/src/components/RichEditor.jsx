import { useMemo, useRef, useEffect, useState } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useTranslation } from 'react-i18next'
import { Table, Plus, Minus, Trash2, Check, X } from 'lucide-react'

/**
 * WYSIWYG editor (Quill) used inside ProjectWorkspace.
 *
 * Storage model: we keep the existing `content_json` shape on PageVersion by
 * embedding the Quill HTML output under `{ format: "quill", html: "..." }`.
 * The legacy Tiptap-style `{ type: "doc", content: [...] }` shape is still
 * supported on read so old pages keep rendering until they get re-saved.
 *
 * Beyond rich text, this editor supports:
 *   - media: images + embedded videos (YouTube/Vimeo/mp4 URLs)
 *   - comparative tables (see ComparativeTable blot below)
 *   - per-selection discipline color-coding: a contributor highlights the text
 *     they authored with their discipline's color, so the disciplinary origin
 *     of each contribution is traceable inline (background color persists in
 *     the saved HTML).
 *
 * RTL: when i18next is in Arabic mode, Quill receives `direction: "rtl"` and
 * a logical `text-align: right` so the toolbar + editor flip correctly.
 */

/* ------------------------------------------------------------------ */
/* Comparative-table support.                                          */
/*                                                                     */
/* The Quill 1.3.7 build shipped with react-quill does NOT bundle the  */
/* experimental table module, so we cannot use Quill's own table       */
/* editing. Instead we register a self-contained block embed: the      */
/* whole <table> is ONE atomic node that Quill never tries to place a  */
/* cursor inside. This sidesteps every cursor/selection bug that makes  */
/* hand-rolled Quill tables flaky — the table is edited through a small */
/* modal in React, and its data round-trips losslessly because we keep  */
/* the cell matrix in a data-* attribute.                               */
/* ------------------------------------------------------------------ */
const BlockEmbed = Quill.import('blots/block/embed')

function renderTableHTML({ cells }) {
  const [head, ...body] = cells
  const thead = head
    ? `<thead><tr>${head.map((c) => `<th>${escapeCell(c)}</th>`).join('')}</tr></thead>`
    : ''
  const tbody = `<tbody>${body
    .map((row) => `<tr>${row.map((c) => `<td>${escapeCell(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`
  return thead + tbody
}

// Cells hold plain text only; escape so a stray "<" can't inject markup.
function escapeCell(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

class ComparativeTable extends BlockEmbed {
  static create(value) {
    const node = super.create()
    node.setAttribute('contenteditable', 'false')
    node.setAttribute('data-cells', JSON.stringify(value.cells))
    node.innerHTML = renderTableHTML(value)
    return node
  }

  // Reconstruct the cell matrix when Quill re-parses saved HTML. We read it
  // back from data-cells (authoritative); the rendered DOM is just a view.
  static value(node) {
    try {
      return { cells: JSON.parse(node.getAttribute('data-cells') || '[]') }
    } catch {
      return { cells: [] }
    }
  }
}
ComparativeTable.blotName = 'comparativeTable'
ComparativeTable.tagName = 'table'
ComparativeTable.className = 'comparative-table'

// Register once (module load). Guard against double-registration during HMR.
if (!Quill.imports['formats/comparativeTable']) {
  Quill.register(ComparativeTable)
}

const FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'blockquote', 'code-block',
  'link', 'image', 'video', 'align', 'direction',
  'background', 'comparativeTable',
]

const emptyMatrix = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))

export default function RichEditor({ value, onChange, placeholder, borderColor, disciplines = [] }) {
  const { i18n } = useTranslation()
  const isRtl = i18n.language?.startsWith('ar')
  const ref = useRef(null)

  // Table modal: null when closed, otherwise { index, cells } where `index` is
  // the Quill position to (re)insert at — for a brand-new table it's the
  // current cursor, for an edit it's the existing embed's index.
  const [tableEdit, setTableEdit] = useState(null)

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      [{ align: [] }, { direction: 'rtl' }],
      ['clean'],
    ],
    clipboard: { matchVisual: false },
  }), [])

  // When the document language flips, force the Quill root direction so the
  // current editor instance reflows even without re-mount.
  useEffect(() => {
    const root = ref.current?.getEditor()?.root
    if (!root) return
    root.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
    root.style.textAlign = isRtl ? 'right' : 'left'
  }, [isRtl])

  // Clicking an existing comparative table re-opens it in the modal. The
  // table is contenteditable=false, so Quill ignores the click; we delegate
  // from the root and map the DOM node back to its blot index.
  useEffect(() => {
    const editor = ref.current?.getEditor()
    if (!editor) return
    const onClick = (e) => {
      const tableEl = e.target.closest?.('table.comparative-table')
      if (!tableEl || !editor.root.contains(tableEl)) return
      const blot = Quill.find(tableEl)
      if (!blot) return
      const index = editor.getIndex(blot)
      let cells = []
      try { cells = JSON.parse(tableEl.getAttribute('data-cells') || '[]') } catch { /* keep [] */ }
      setTableEdit({ index, cells })
    }
    editor.root.addEventListener('click', onClick)
    return () => editor.root.removeEventListener('click', onClick)
  }, [])

  const getEditor = () => ref.current?.getEditor()

  // Apply (or clear, when color===false) a background to the current selection.
  // With a collapsed cursor we color the whole line the cursor sits on, so a
  // single click tags an entire paragraph.
  const paintBackground = (color) => {
    const editor = getEditor()
    if (!editor) return
    const range = editor.getSelection(true)
    if (!range) return
    if (range.length === 0) {
      const [line, offset] = editor.getLine(range.index)
      if (!line) return
      const start = range.index - offset
      editor.formatText(start, line.length(), 'background', color, 'user')
    } else {
      editor.formatText(range.index, range.length, 'background', color, 'user')
    }
  }

  // Open the modal pre-filled with a fresh 3×3 matrix at the cursor.
  const openNewTable = () => {
    const editor = getEditor()
    if (!editor) return
    const range = editor.getSelection(true)
    const index = range ? range.index : editor.getLength()
    setTableEdit({ index, cells: emptyMatrix(3, 3), isNew: true })
  }

  // Commit the modal: replace the existing embed (edit) or insert a new one.
  const commitTable = () => {
    const editor = getEditor()
    if (!editor || !tableEdit) return
    const { index, cells, isNew } = tableEdit
    editor.focus()
    if (!isNew) editor.deleteText(index, 1, 'user')          // drop the old table
    editor.insertEmbed(index, 'comparativeTable', { cells }, 'user')
    editor.setSelection(index + 1, 0, 'silent')              // park cursor after it
    setTableEdit(null)
  }

  const deleteTable = () => {
    const editor = getEditor()
    if (!editor || !tableEdit || tableEdit.isNew) { setTableEdit(null); return }
    editor.deleteText(tableEdit.index, 1, 'user')
    setTableEdit(null)
  }

  const ctrlBtn = 'p-1.5 rounded hover:bg-sand-200 text-sand-600 disabled:opacity-40'

  return (
    <div
      className="quill-shell rounded-lg overflow-hidden border"
      style={{ borderColor: borderColor || 'rgb(228 222 213)' }}
    >
      {/* Custom control bar: comparative-table control + discipline tagging. */}
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-sand-200 bg-sand-50">
        <button type="button" className={ctrlBtn} title="Insérer un tableau comparatif"
                onClick={openNewTable}>
          <Table size={15} />
        </button>

        {disciplines.length > 0 && (
          <>
            <span className="w-px h-5 bg-sand-200 mx-1" />
            <span className="text-[11px] text-sand-500 uppercase tracking-wide">Discipline</span>
            {disciplines.map((d) => (
              <button
                key={d.id}
                type="button"
                title={`Marquer la sélection comme : ${d.name_fr}`}
                onClick={() => paintBackground(d.color_hex)}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:opacity-80"
                style={{ borderColor: d.color_hex, color: d.color_hex }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color_hex }} />
                {d.name_fr}
              </button>
            ))}
            <button type="button" onClick={() => paintBackground(false)}
                    className="text-xs text-sand-500 hover:text-sand-800 underline">
              Effacer
            </button>
          </>
        )}
      </div>

      <ReactQuill
        ref={ref}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />

      {tableEdit && (
        <TableModal
          state={tableEdit}
          onChange={setTableEdit}
          onCommit={commitTable}
          onDelete={deleteTable}
          onCancel={() => setTableEdit(null)}
        />
      )}
    </div>
  )
}

/**
 * Lightweight grid editor for a comparative table. The first row is rendered
 * as the header. Rows/columns can be added or removed; cells are plain-text
 * (intentionally — comparative tables stay legible and copy-pasteable).
 */
function TableModal({ state, onChange, onCommit, onDelete, onCancel }) {
  const { cells, isNew } = state
  const rows = cells.length
  const cols = cells[0]?.length || 0

  const setCell = (r, c, v) => {
    const next = cells.map((row) => row.slice())
    next[r][c] = v
    onChange({ ...state, cells: next })
  }
  const addRow = () => onChange({ ...state, cells: [...cells.map((r) => r.slice()), Array(cols).fill('')] })
  const removeRow = () => rows > 1 && onChange({ ...state, cells: cells.slice(0, -1) })
  const addCol = () => onChange({ ...state, cells: cells.map((r) => [...r, '']) })
  const removeCol = () => cols > 1 && onChange({ ...state, cells: cells.map((r) => r.slice(0, -1)) })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         onClick={onCancel}>
      <div className="card p-5 w-full max-w-3xl max-h-[85vh] overflow-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Table size={18} className="text-terracotta-700" />
            {isNew ? 'Nouveau tableau comparatif' : 'Modifier le tableau'}
          </h3>
          <button onClick={onCancel} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <span className="text-sand-500">Lignes : {rows}</span>
          <button onClick={addRow} className="btn-secondary px-2 py-1"><Plus size={14} /></button>
          <button onClick={removeRow} disabled={rows <= 1} className="btn-secondary px-2 py-1"><Minus size={14} /></button>
          <span className="w-px h-5 bg-sand-200 mx-1" />
          <span className="text-sand-500">Colonnes : {cols}</span>
          <button onClick={addCol} className="btn-secondary px-2 py-1"><Plus size={14} /></button>
          <button onClick={removeCol} disabled={cols <= 1} className="btn-secondary px-2 py-1"><Minus size={14} /></button>
        </div>

        <div className="overflow-auto border border-sand-200 rounded-lg">
          <table className="w-full border-collapse">
            <tbody>
              {cells.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border border-sand-200 p-0">
                      <input
                        value={cell}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        placeholder={r === 0 ? 'En-tête' : '…'}
                        className={`w-full px-2 py-1.5 bg-transparent focus:outline-none focus:bg-terracotta-50
                                    ${r === 0 ? 'font-semibold' : ''}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {!isNew ? (
            <button onClick={onDelete} className="btn-danger">
              <Trash2 size={16} /> Supprimer
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn-ghost">Annuler</button>
            <button onClick={onCommit} className="btn-primary">
              <Check size={16} /> {isNew ? 'Insérer' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

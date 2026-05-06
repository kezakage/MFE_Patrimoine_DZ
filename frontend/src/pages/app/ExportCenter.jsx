import { useState } from 'react'
import { FileText, Download, Printer, FileImage, Settings2 } from 'lucide-react'
import { PROJECTS } from '../../data/projects.js'

export default function ExportCenter() {
  const [project, setProject] = useState(PROJECTS[0].id)
  const [format, setFormat] = useState('pdf')
  const [opts, setOpts] = useState({ images: true, annotations: true, sources: true, history: false })
  const set = (k) => () => setOpts({ ...opts, [k]: !opts[k] })

  const p = PROJECTS.find(x => x.id === project)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="section-title flex items-center gap-2"><Download/>Export & impression</h1>
        <p className="section-subtitle">Générez des documents scientifiques téléchargeables.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6 space-y-5">
          <div>
            <label className="label">Projet à exporter</label>
            <select className="input" value={project} onChange={e=>setProject(e.target.value)}>
              {PROJECTS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { k:'pdf', l:'PDF scientifique', i: FileText },
                { k:'print', l:'Version imprimable', i: Printer },
                { k:'archive', l:'Archive (ZIP)', i: FileImage },
              ].map(o => (
                <button key={o.k} onClick={()=>setFormat(o.k)}
                        className={`p-4 rounded-lg border ${format===o.k?'border-terracotta-500 bg-terracotta-50':'border-sand-200 hover:border-sand-300'}`}>
                  <o.i className="mx-auto text-terracotta-700" size={22}/>
                  <div className="text-sm font-medium mt-1">{o.l}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1"><Settings2 size={14}/>Contenu inclus</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { k:'images', l:'Galerie d\'images' },
                { k:'annotations', l:'Annotations' },
                { k:'sources', l:'Sources & bibliographie' },
                { k:'history', l:'Historique des versions' },
              ].map(o => (
                <label key={o.k} className="flex items-center gap-2 p-3 rounded-lg border border-sand-200 cursor-pointer hover:bg-sand-50">
                  <input type="checkbox" checked={opts[o.k]} onChange={set(o.k)}/>
                  <span className="text-sm">{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="btn-primary w-full"><Download size={16}/>Générer le document</button>
        </div>

        <aside className="card p-5">
          <h3 className="font-semibold">Aperçu</h3>
          <div className="mt-3 aspect-[3/4] rounded-lg bg-white border border-sand-200 p-4 text-xs text-sand-700 overflow-hidden">
            <div className="border-b border-sand-200 pb-2 mb-2">
              <div className="text-[10px] uppercase tracking-widest text-sand-500">Patrimoine.dz</div>
              <div className="font-display text-base font-semibold">{p.name}</div>
              <div className="text-[10px]">{p.region} • {p.period} • {p.type}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Présentation</div>
              <p className="line-clamp-3">{p.description}</p>
              <div className="font-medium mt-2">Description architecturale</div>
              <p className="line-clamp-3">Le bâtiment est organisé autour d'une cour centrale...</p>
              {opts.images && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {Array.from({length:4}).map((_,i)=>(
                    <div key={i} className="h-12 rounded" style={{background:`linear-gradient(135deg, ${p.coverColor}, #3e2417)`}}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="card p-5">
        <h3 className="font-semibold mb-3">Exports récents</h3>
        <ul className="divide-y divide-sand-100">
          {[
            { n:'Casbah_Alger_v8.pdf', d:'Hier 16:32', s:'2.4 Mo' },
            { n:'Timgad_print.pdf', d:'21 avril', s:'1.1 Mo' },
            { n:'Mzab_archive.zip', d:'15 avril', s:'24 Mo' },
          ].map((f,i) => (
            <li key={i} className="py-3 flex items-center gap-3">
              <FileText size={18} className="text-terracotta-700"/>
              <div className="flex-1">
                <div className="font-medium text-sm">{f.n}</div>
                <div className="text-xs text-sand-500">{f.d} • {f.s}</div>
              </div>
              <button className="btn-secondary text-sm"><Download size={14}/></button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

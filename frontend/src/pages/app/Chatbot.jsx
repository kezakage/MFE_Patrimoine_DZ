import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  "Quels sont les monuments ottomans documentés sur la plateforme ?",
  "Donne-moi les dimensions de la mosquée Ketchaoua",
  "Liste les sites UNESCO en Algérie",
  "Quelles sont les caractéristiques du M'Zab ?",
]

const FAKE_REPLIES = {
  default: "D'après les contenus de la plateforme, voici les informations correspondantes. Plusieurs experts ont contribué à ces notices, et vous pouvez consulter les sources directement depuis chaque projet.",
  unesco: "Quatre sites algériens sont inscrits au patrimoine mondial de l'UNESCO documentés ici : la Casbah d'Alger, Timgad, le M'Zab (Ghardaïa) et Tipaza. Cliquez sur chacun pour la notice complète.",
  ottoman: "La plateforme référence plusieurs monuments ottomans : la Casbah d'Alger, la mosquée Ketchaoua, et plusieurs palais de la médina d'Alger. Tous sont accessibles depuis la page Explorer.",
  mzab: "Le M'Zab (vallée de Ghardaïa) est une pentapole ibadite remarquable inscrite à l'UNESCO en 1982. Architecture sobre, mosquées austères, organisation urbaine autour de la fontaine et du marché.",
}

function pickReply(q) {
  const s = q.toLowerCase()
  if (s.includes('unesco')) return FAKE_REPLIES.unesco
  if (s.includes('ottoman')) return FAKE_REPLIES.ottoman
  if (s.includes('mzab') || s.includes("m'zab") || s.includes('ghardaïa')) return FAKE_REPLIES.mzab
  return FAKE_REPLIES.default
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role:'bot', t:'Bonjour ! Je suis votre assistant documentaire. Posez-moi une question sur le patrimoine architectural algérien.' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  const send = (text) => {
    const q = (text ?? input).trim()
    if (!q) return
    setMessages(m => [...m, { role:'user', t:q }])
    setInput(''); setTyping(true)
    setTimeout(() => {
      setMessages(m => [...m, { role:'bot', t: pickReply(q) }])
      setTyping(false)
    }, 700)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="section-title flex items-center gap-2"><Bot/>Chatbot documentaire</h1>
        <p className="section-subtitle">Posez vos questions ; les réponses sont basées sur les contenus de la plateforme.</p>
      </div>

      <div className="card flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {messages.map((m,i) => (
            <div key={i} className={`flex gap-3 ${m.role==='user'?'flex-row-reverse':''}`}>
              <div className={`w-8 h-8 rounded-full grid place-items-center text-white flex-shrink-0 ${m.role==='user'?'bg-sand-700':'bg-terracotta-600'}`}>
                {m.role==='user' ? <UserIcon size={16}/> : <Bot size={16}/>}
              </div>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${m.role==='user'?'bg-terracotta-600 text-white':'bg-sand-50 border border-sand-200'}`}>
                {m.t}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-terracotta-600 grid place-items-center text-white"><Bot size={16}/></div>
              <div className="px-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-sand-400 animate-bounce"/>
                <span className="w-2 h-2 rounded-full bg-sand-400 animate-bounce [animation-delay:120ms]"/>
                <span className="w-2 h-2 rounded-full bg-sand-400 animate-bounce [animation-delay:240ms]"/>
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        <div className="p-3 border-t border-sand-200 space-y-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={()=>send(s)} className="chip bg-sand-100 hover:bg-sand-200 text-sand-700 cursor-pointer">
                <Sparkles size={12}/>{s}
              </button>
            ))}
          </div>
          <form onSubmit={(e)=>{e.preventDefault(); send()}} className="flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} className="input flex-1" placeholder="Posez votre question..."/>
            <button className="btn-primary"><Send size={16}/></button>
          </form>
        </div>
      </div>
    </div>
  )
}

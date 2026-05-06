import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

const seed = [
  { id: 'n1', type: 'contribution', title: 'Nouvelle contribution', body: 'Karim a ajouté une section au projet "Casbah d\'Alger"', date: '2026-04-30T10:12:00Z', read: false },
  { id: 'n2', type: 'conflit', title: 'Conflit éditorial', body: 'Désaccord sur la datation de la mosquée Ketchaoua', date: '2026-04-29T14:00:00Z', read: false },
  { id: 'n3', type: 'validation', title: 'Validation requise', body: 'Annotation IA en attente sur la photo #234', date: '2026-04-28T09:30:00Z', read: true },
  { id: 'n4', type: 'systeme', title: 'Bienvenue', body: 'Votre profil expert est en cours de validation', date: '2026-04-26T08:00:00Z', read: true },
]

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState(seed)
  const unread = items.filter(n => !n.read).length

  const markAllRead = () => setItems(items.map(n => ({ ...n, read: true })))
  const markRead = (id) => setItems(items.map(n => n.id === id ? { ...n, read: true } : n))
  const push = (n) => setItems(prev => [{ id: 'n' + Date.now(), date: new Date().toISOString(), read: false, ...n }, ...prev])

  return <Ctx.Provider value={{ items, unread, markAllRead, markRead, push }}>{children}</Ctx.Provider>
}

export const useNotifications = () => useContext(Ctx)

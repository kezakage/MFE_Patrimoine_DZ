import { createContext, useContext, useEffect, useState } from 'react'
import { notifications as notifApi } from '../lib/api.js'
import { openNotificationsSocket } from '../lib/ws.js'
import { useAuth } from './AuthContext.jsx'

const Ctx = createContext(null)

function normalize(n) {
  return {
    id: n.id,
    type: n.kind || n.type || 'systeme',
    title: n.title || 'Notification',
    body: n.body || n.message || '',
    date: n.created_at || n.date || new Date().toISOString(),
    read: n.is_read ?? n.read ?? false,
    payload: n.payload || null,
  }
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth() || {}
  const [items, setItems] = useState([])
  const unread = items.filter(n => !n.read).length

  useEffect(() => {
    if (!user) { setItems([]); return }
    let cancelled = false
    notifApi.list()
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : (data.results || [])
        setItems(list.map(normalize))
      })
      .catch(() => {})

    const close = openNotificationsSocket((payload) => {
      setItems((prev) => [normalize(payload), ...prev])
    })

    return () => { cancelled = true; close() }
  }, [user?.id])

  const markAllRead = async () => {
    setItems((prev) => prev.map(n => ({ ...n, read: true })))
    try { await notifApi.markAllRead() } catch (_) {}
  }

  const markRead = async (id) => {
    setItems((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try { await notifApi.markRead(id) } catch (_) {}
  }

  const push = (n) => setItems(prev => [normalize({ id: 'local-' + Date.now(), ...n }), ...prev])

  return <Ctx.Provider value={{ items, unread, markAllRead, markRead, push }}>{children}</Ctx.Provider>
}

export const useNotifications = () => useContext(Ctx)

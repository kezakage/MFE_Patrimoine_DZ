import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Search, Bot, ImagePlus,
  Bell, Download, User, LogOut, Shield, Users as UsersIcon,
  BarChart3, FolderCog, Compass
} from 'lucide-react'
import Logo from '../components/Logo.jsx'
import Avatar from '../components/Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotifications } from '../context/NotificationsContext.jsx'

const item = ({isActive}) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-terracotta-50 text-terracotta-700' : 'text-sand-700 hover:bg-sand-100'
  }`

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { unread } = useNotifications()
  const nav = useNavigate()
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => { logout(); nav('/') }

  return (
    <div className="min-h-screen flex bg-sand-50">
      <aside className="w-64 bg-white border-r border-sand-200 flex flex-col sticky top-0 h-screen">
        <div className="px-4 h-16 flex items-center border-b border-sand-200"><Logo to="/app/tableau-de-bord" /></div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
          <div>
            <div className="px-3 text-[10px] uppercase tracking-widest text-sand-500 mb-2">Espace personnel</div>
            <NavLink to="/app/tableau-de-bord" className={item}><LayoutDashboard size={18}/>Tableau de bord</NavLink>
            <NavLink to="/app/profil" className={item}><User size={18}/>Mon profil</NavLink>
            <NavLink to="/app/notifications" className={item}>
              <Bell size={18}/>Notifications
              {unread > 0 && <span className="ml-auto chip bg-terracotta-100 text-terracotta-700">{unread}</span>}
            </NavLink>
          </div>

          <div>
            <div className="px-3 text-[10px] uppercase tracking-widest text-sand-500 mb-2">Collaboration</div>
            <NavLink to="/app/projets" className={item}><FolderKanban size={18}/>Projets</NavLink>
            <NavLink to="/app/recherche" className={item}><Search size={18}/>Recherche avancée</NavLink>
            <NavLink to="/explorer" className={item}><Compass size={18}/>Explorer (public)</NavLink>
          </div>

          <div>
            <div className="px-3 text-[10px] uppercase tracking-widest text-sand-500 mb-2">Modules IA</div>
            <NavLink to="/app/chatbot" className={item}><Bot size={18}/>Chatbot documentaire</NavLink>
            <NavLink to="/app/annotation-auto" className={item}><ImagePlus size={18}/>Annotation auto.</NavLink>
          </div>

          <div>
            <div className="px-3 text-[10px] uppercase tracking-widest text-sand-500 mb-2">Outils</div>
            <NavLink to="/app/export" className={item}><Download size={18}/>Export & PDF</NavLink>
          </div>

          {isAdmin && (
            <div>
              <div className="px-3 text-[10px] uppercase tracking-widest text-sand-500 mb-2 flex items-center gap-1">
                <Shield size={12}/>Administration
              </div>
              <NavLink to="/app/admin/utilisateurs" className={item}><UsersIcon size={18}/>Utilisateurs</NavLink>
              <NavLink to="/app/admin/projets" className={item}><FolderCog size={18}/>Projets</NavLink>
              <NavLink to="/app/admin/statistiques" className={item}><BarChart3 size={18}/>Statistiques</NavLink>
            </div>
          )}
        </nav>

        <div className="border-t border-sand-200 p-3">
          <Link to="/app/profil" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sand-100">
            <Avatar initials={user.avatar} size={36}/>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-sand-500 capitalize truncate">{user.role}</div>
            </div>
          </Link>
          <button onClick={handleLogout} className="mt-2 w-full btn-ghost justify-start">
            <LogOut size={16}/>Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-sand-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm text-sand-600">
            Bonjour <span className="font-medium text-sand-900">{user.name.split(' ')[0]}</span> 👋
            {!user.validated && (
              <span className="ml-3 chip bg-amber-100 text-amber-800">Profil en attente de validation</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app/notifications" className="relative btn-ghost">
              <Bell size={18}/>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 grid place-items-center rounded-full text-[10px] bg-terracotta-600 text-white">{unread}</span>
              )}
            </Link>
            <Link to="/app/projets/nouveau" className="btn-primary">+ Nouveau projet</Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-x-hidden"><Outlet /></main>
      </div>
    </div>
  )
}

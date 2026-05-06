import { Outlet, NavLink, Link } from 'react-router-dom'
import { Compass, Home as HomeIcon, LogIn, UserPlus } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function PublicLayout() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-sand-50/85 backdrop-blur border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'nav-link-active':''}`}>
              <span className="flex items-center gap-1.5"><HomeIcon size={16}/>Accueil</span>
            </NavLink>
            <NavLink to="/explorer" className={({isActive}) => `nav-link ${isActive ? 'nav-link-active':''}`}>
              <span className="flex items-center gap-1.5"><Compass size={16}/>Explorer</span>
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app/tableau-de-bord" className="btn-primary">Mon espace</Link>
            ) : (
              <>
                <Link to="/connexion" className="btn-ghost"><LogIn size={16}/>Connexion</Link>
                <Link to="/inscription" className="btn-primary"><UserPlus size={16}/>Inscription</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-sand-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="text-sm text-sand-600 mt-3 max-w-xs">
              Plateforme collaborative dédiée à la documentation scientifique du patrimoine architectural algérien.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sand-900">Plateforme</h4>
            <ul className="space-y-2 text-sm text-sand-600">
              <li><Link to="/explorer">Explorer</Link></li>
              <li><Link to="/inscription">Devenir contributeur</Link></li>
              <li><Link to="/connexion">Espace expert</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sand-900">Ressources</h4>
            <ul className="space-y-2 text-sm text-sand-600">
              <li>Documentation</li>
              <li>Guide du contributeur</li>
              <li>Charte scientifique</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sand-900">Contact</h4>
            <ul className="space-y-2 text-sm text-sand-600">
              <li>contact@patrimoine.dz</li>
              <li>Alger, Algérie</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sand-200 py-4 text-center text-xs text-sand-500">
          © {new Date().getFullYear()} Patrimoine.dz — Projet de fin d'études
        </div>
      </footer>
    </div>
  )
}

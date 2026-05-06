import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-sand-50 px-4">
      <div className="text-center">
        <div className="font-display text-8xl font-bold text-terracotta-600">404</div>
        <h1 className="mt-2 text-2xl font-semibold">Page introuvable</h1>
        <p className="text-sand-600 mt-1">La page recherchée n'existe pas ou a été déplacée.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Retour à l'accueil</Link>
      </div>
    </div>
  )
}

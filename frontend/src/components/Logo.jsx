import { Link } from 'react-router-dom'

export default function Logo({ to = '/', white = false }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <span className="w-9 h-9 rounded-lg bg-terracotta-600 grid place-items-center text-white font-bold shadow-soft group-hover:scale-105 transition-transform">
        ⵣ
      </span>
      <div className="leading-tight">
        <div className={`font-display font-bold text-lg ${white ? 'text-white' : 'text-sand-900'}`}>Patrimoine<span className="text-terracotta-600">.dz</span></div>
        <div className={`text-[10px] uppercase tracking-widest ${white ? 'text-sand-200' : 'text-sand-500'}`}>Architecture algérienne</div>
      </div>
    </Link>
  )
}

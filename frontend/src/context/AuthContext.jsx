import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const DEMO_USERS = {
  expert: {
    id: 'u1',
    name: 'Dr. Amina Belhadj',
    email: 'amina.belhadj@univ-alger.dz',
    role: 'expert',
    discipline: 'Architecture islamique',
    institution: 'Université d\'Alger',
    avatar: 'AB',
    validated: true,
  },
  chercheur: {
    id: 'u2',
    name: 'Karim Saadi',
    email: 'karim.saadi@cnrpah.dz',
    role: 'chercheur',
    discipline: 'Histoire',
    institution: 'CNRPAH',
    avatar: 'KS',
    validated: false,
  },
  admin: {
    id: 'u3',
    name: 'Yacine Admin',
    email: 'admin@patrimoine.dz',
    role: 'admin',
    discipline: '—',
    institution: 'Plateforme',
    avatar: 'YA',
    validated: true,
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pfe.user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('pfe.user', JSON.stringify(user))
    else localStorage.removeItem('pfe.user')
  }, [user])

  const login = async (email, _password) => {
    // Demo: pick role from email
    let preset = DEMO_USERS.expert
    if (email?.includes('admin')) preset = DEMO_USERS.admin
    else if (email?.includes('cher')) preset = DEMO_USERS.chercheur
    setUser({ ...preset, email: email || preset.email })
    return true
  }

  const loginAs = (role) => setUser(DEMO_USERS[role])

  const register = async (data) => {
    setUser({
      id: 'u-new',
      name: data.name,
      email: data.email,
      role: data.role || 'chercheur',
      discipline: data.discipline,
      institution: data.institution,
      avatar: (data.name || 'NV').slice(0,2).toUpperCase(),
      validated: false,
    })
    return true
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, loginAs, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/admin', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: msg } = await signIn(email, password)
    setLoading(false)
    if (msg) {
      setError(msg)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-zinc-900">
            <Lock size={18} />
          </div>
          <h1 className="text-lg font-bold text-white">Acceso Administrador</h1>
          <p className="text-sm text-zinc-500">Solo el propietario. Sin registro público.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="rounded-lg bg-red-950/40 border border-red-800/40 px-3 py-2 text-sm text-red-300">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-600">
          <Link to="/" className="hover:text-amber-400 underline">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}

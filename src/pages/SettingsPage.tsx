import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Save, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { getContactSettings, saveContactSettings } from '../services/settings.service'

export function SettingsPage() {
  const { user } = useAuth()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getContactSettings()
      .then((c) => {
        setPhone(c.phone)
        setEmail(c.email)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      await saveContactSettings(phone, email)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando ajustes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-amber-400">
              <Settings size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none text-white">Ajustes</h1>
              <p className="text-xs text-zinc-500">{user?.email} · Panel privado</p>
            </div>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
            <ArrowLeft size={16} /> Inventario
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <h2 className="text-lg font-bold text-white">Contacto público</h2>
            <p className="text-sm text-zinc-500">Se muestra en el botón Contacto del catálogo (WhatsApp y Email).</p>
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-zinc-500">Cargando valores actuales…</p>
          ) : (
            <>
              <div>
                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 123 456"
                  required
                  autoComplete="tel"
                />
                <p className="mt-1 text-xs text-zinc-500">El link de WhatsApp se arma solo con los números.</p>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </>
          )}

          {error && <p className="rounded-lg border border-red-800/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}
          {saved && (
            <p className="flex items-center gap-1.5 rounded-lg border border-emerald-800/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
              <CheckCircle2 size={16} /> Guardado. Ya se ve en el catálogo.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

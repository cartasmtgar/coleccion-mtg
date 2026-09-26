import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailOpen, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import {
  getMessages,
  setMessageRead,
  deleteMessage,
  type ContactMessage,
} from '../services/messages.service'
import { useAuth } from '../context/AuthContext'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' })
}

export function MessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setMessages(await getMessages())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando mensajes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggleRead = async (m: ContactMessage) => {
    setBusyId(m.id)
    try {
      await setMessageRead(m.id, !m.read)
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: !m.read } : x)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error actualizando')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (m: ContactMessage) => {
    if (!window.confirm(`¿Eliminar el mensaje de "${m.name}"?`)) return
    setBusyId(m.id)
    try {
      await deleteMessage(m.id)
      setMessages((prev) => prev.filter((x) => x.id !== m.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error eliminando')
    } finally {
      setBusyId(null)
    }
  }

  const unread = messages.filter((m) => !m.read).length

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-amber-400">
              <Mail size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none text-white">Mensajes</h1>
              <p className="text-xs text-zinc-500">{user?.email} · Panel privado</p>
            </div>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
            <ArrowLeft size={16} /> Inventario
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Bandeja de contacto</h2>
          <span className="text-sm text-zinc-500">
            {messages.length} mensajes · {unread} sin leer
          </span>
        </div>

        {loading && <p className="py-10 text-center text-zinc-500">Cargando mensajes…</p>}
        {error && <p className="py-6 text-center text-red-400">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="py-10 text-center text-zinc-500">Todavía no hay mensajes del formulario.</p>
        )}

        {messages.map((m) => (
          <article
            key={m.id}
            className={`rounded-2xl border p-4 transition ${m.read ? 'border-zinc-800 bg-zinc-900/60' : 'border-amber-700/40 bg-amber-950/10'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{m.name}</span>
                  {!m.read && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-zinc-900">
                      Nuevo
                    </span>
                  )}
                </div>
                <a href={`mailto:${m.email}`} className="text-sm text-amber-400 hover:underline">
                  {m.email}
                </a>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {formatDate(m.created_at)}
                  {m.cards ? ` · Interesa: ${m.cards}` : ''}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === m.id}
                  onClick={() => toggleRead(m)}
                  aria-label={m.read ? 'Marcar no leído' : 'Marcar leído'}
                  title={m.read ? 'Marcar no leído' : 'Marcar leído'}
                  className="h-9 w-9 p-0"
                >
                  {busyId === m.id ? <Loader2 size={18} className="animate-spin" /> : m.read ? <Mail size={18} /> : <MailOpen size={18} />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === m.id}
                  onClick={() => remove(m)}
                  aria-label="Eliminar mensaje"
                  title="Eliminar mensaje"
                  className="h-9 w-9 p-0 !text-red-500 hover:!text-red-400 hover:bg-red-950/30"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{m.message}</p>
          </article>
        ))}
      </main>
    </div>
  )
}

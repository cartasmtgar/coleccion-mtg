import { MessageCircle, Mail, Send, Loader2, Copy, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { CONTACT_INFO } from '../../lib/constants'
import { getContactSettings, type ContactSettings } from '../../services/settings.service'
import { saveContactMessage, notifyContactByEmail } from '../../services/messages.service'
import { useEffect, useState } from 'react'

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [mailPending, setMailPending] = useState(false)
  const [contact, setContact] = useState<ContactSettings | null>(null)
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorCards, setVisitorCards] = useState('')
  const [visitorMessage, setVisitorMessage] = useState('')
  const [copiedEmail, setCopiedEmail] = useState(false)

  useEffect(() => {
    if (open) {
      getContactSettings().then(setContact).catch(() => null)
      setSent(false)
      setSendError(null)
      setMailPending(false)
    }
  }, [open])

  const whatsapp = contact?.phone ?? CONTACT_INFO.whatsapp
  const whatsappLink = contact?.whatsappLink ?? CONTACT_INFO.whatsappLink
  const email = contact?.email ?? CONTACT_INFO.email
  const whatsappLinkWithText =
    `${whatsappLink}?text=${encodeURIComponent('Hola, me interesa una carta de tu colección.')}`

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = email
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendError(null)
    setMailPending(false)
    const input = {
      name: visitorName,
      email: visitorEmail,
      cards: visitorCards,
      message: visitorMessage,
    }
    try {
      await saveContactMessage(input)
      const { emailed, needsActivation } = await notifyContactByEmail(email, input)
      if (!emailed) setMailPending(needsActivation)
      setSent(true)
      setVisitorName('')
      setVisitorEmail('')
      setVisitorCards('')
      setVisitorMessage('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'No se pudo enviar. Intenta por WhatsApp o Email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Contacto — Cotiza tus cartas">
      <div className="space-y-6">
        <p className="text-sm text-zinc-400">
          ¿Te interesa alguna carta? Escríbenos para cotizar, consultar disponibilidad o coordinar entrega. Sin carrito, trato directo.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={whatsappLinkWithText}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-4 hover:bg-emerald-900/30 transition"
          >
            <MessageCircle className="text-emerald-400" />
            <div>
              <div className="text-sm font-semibold text-white">WhatsApp</div>
              <div className="text-xs text-zinc-400">{whatsapp}</div>
            </div>
          </a>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <Mail className="shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">Email</div>
              <div className="truncate text-xs text-zinc-400">{email}</div>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              title={copiedEmail ? '¡Copiado!' : 'Copiar email'}
              aria-label="Copiar email al portapapeles"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:border-amber-500 hover:text-amber-400"
            >
              {copiedEmail ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        >
          <h3 className="text-sm font-semibold text-white">Formulario rápido</h3>
          <Input placeholder="Tu nombre" required value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
          <Input type="email" placeholder="Tu email" required value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} />
          <Input placeholder="Carta(s) de interés (opcional)" value={visitorCards} onChange={(e) => setVisitorCards(e.target.value)} />
          <Textarea placeholder="Mensaje..." rows={3} required value={visitorMessage} onChange={(e) => setVisitorMessage(e.target.value)} />
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Enviando…' : 'Enviar consulta'}
          </Button>
          {sendError && <p className="text-sm text-red-300">{sendError}</p>}
          {sent && <p className="text-sm text-emerald-400">¡Gracias! Te contactaremos pronto.</p>}
          {sent && mailPending && (
            <p className="text-xs text-amber-300">Tu consulta quedó guardada. El aviso por mail se activa con 1 clic en tu bandeja (primera vez).</p>
          )}
        </form>
      </div>
    </Modal>
  )
}

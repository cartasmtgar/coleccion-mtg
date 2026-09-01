import { MessageCircle, Mail, Send } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { CONTACT_INFO } from '../../lib/constants'
import { useState } from 'react'

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Contacto — Cotiza tus cartas">
      <div className="space-y-6">
        <p className="text-sm text-zinc-400">
          ¿Te interesa alguna carta? Escríbenos para cotizar, consultar disponibilidad o coordinar entrega. Sin carrito, trato directo.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={CONTACT_INFO.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-4 hover:bg-emerald-900/30 transition"
          >
            <MessageCircle className="text-emerald-400" />
            <div>
              <div className="text-sm font-semibold text-white">WhatsApp</div>
              <div className="text-xs text-zinc-400">{CONTACT_INFO.whatsapp}</div>
            </div>
          </a>
          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800 transition"
          >
            <Mail className="text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-white">Email</div>
              <div className="text-xs text-zinc-400">{CONTACT_INFO.email}</div>
            </div>
          </a>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
            setTimeout(() => setSent(false), 3000)
          }}
          className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        >
          <h3 className="text-sm font-semibold text-white">Formulario rápido</h3>
          <Input placeholder="Tu nombre" required />
          <Input type="email" placeholder="Tu email" required />
          <Input placeholder="Carta(s) de interés" required />
          <Textarea placeholder="Mensaje..." rows={3} required />
          <Button type="submit" className="w-full">
            <Send size={16} /> Enviar consulta
          </Button>
          {sent && <p className="text-sm text-emerald-400">¡Gracias! Te contactaremos pronto. (Demo local — conecta un backend de email para producción)</p>}
        </form>
      </div>
    </Modal>
  )
}

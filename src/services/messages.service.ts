import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface ContactMessage {
  id: string
  name: string
  email: string
  cards: string
  message: string
  read: boolean
  created_at: string
}

export interface NewContactMessage {
  name: string
  email: string
  cards: string
  message: string
}

/** Guarda un mensaje del formulario público (RLS permite insert anónimo). */
export async function saveContactMessage(input: NewContactMessage): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name.trim(),
    email: input.email.trim(),
    cards: input.cards.trim(),
    message: input.message.trim(),
  })
  if (error) throw error
}

/**
 * Avisa por mail vía FormSubmit (gratuito, sin cuentas ni backend).
 * La primera vez pide activar el destino con 1 clic en tu bandeja;
 * el mensaje igual queda guardado en la base, no se pierde nada.
 */
export async function notifyContactByEmail(
  to: string,
  input: NewContactMessage,
): Promise<{ emailed: boolean; needsActivation: boolean }> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        _subject: `Consulta catálogo MTG — ${input.name}`,
        _template: 'table',
        message: `Carta(s) de interés: ${input.cards}\n\n${input.message}\n\nResponder a: ${input.email}`,
      }),
    })
    if (!res.ok) return { emailed: false, needsActivation: false }
    const json = (await res.json()) as { success?: string; message?: string }
    if (json.success === 'true') return { emailed: true, needsActivation: false }
    const needsActivation = /activat/i.test(json.message ?? '')
    return { emailed: false, needsActivation }
  } catch {
    return { emailed: false, needsActivation: false }
  }
}

/** Lista mensajes (requiere login admin). */
export async function getMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ContactMessage[]
}

/** Cuántos sin leer (requiere login admin). */
export async function getUnreadMessagesCount(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  const { count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)
  if (error) return 0
  return count ?? 0
}

export async function setMessageRead(id: string, read: boolean): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase.from('contact_messages').update({ read }).eq('id', id)
  if (error) throw error
}

export async function deleteMessage(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) throw error
}

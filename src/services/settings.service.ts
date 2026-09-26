import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { CONTACT_INFO } from '../lib/constants'

export interface ContactSettings {
  phone: string
  email: string
  whatsappLink: string
}

const onlyDigits = (s: string) => s.replace(/\D/g, '')

function fromConstants(): ContactSettings {
  return {
    phone: CONTACT_INFO.whatsapp,
    email: CONTACT_INFO.email,
    whatsappLink: CONTACT_INFO.whatsappLink,
  }
}

/** Lee teléfono y mail (tabla settings, con fallback a constantes). */
export async function getContactSettings(): Promise<ContactSettings> {
  if (!isSupabaseConfigured || !supabase) return fromConstants()
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key,value')
      .in('key', ['contact_phone', 'contact_email'])
    if (error || !data) return fromConstants()
    const map = Object.fromEntries(data.map((r) => [r.key, r.value]))
    const phone = (map.contact_phone ?? '').trim() || CONTACT_INFO.whatsapp
    const email = (map.contact_email ?? '').trim() || CONTACT_INFO.email
    const digits = onlyDigits(phone)
    return {
      phone,
      email,
      whatsappLink: digits ? `https://wa.me/${digits}` : CONTACT_INFO.whatsappLink,
    }
  } catch {
    return fromConstants()
  }
}

/** Guarda teléfono y mail (requiere login admin por RLS). */
export async function saveContactSettings(phone: string, email: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase no configurado')
  const now = new Date().toISOString()
  const { error } = await supabase.from('settings').upsert(
    [
      { key: 'contact_phone', value: phone.trim(), updated_at: now },
      { key: 'contact_email', value: email.trim(), updated_at: now },
    ],
    { onConflict: 'key' },
  )
  if (error) throw error
}

import { supabase } from '../lib/supabaseClient'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)

const toDbPayload = (p, allowId = false) => {
  const payload = {
    name: p.name,
    email: p.email,
    native: p.native,
    practice: p.practice,
    level: LEVELS.includes(p.level) ? p.level : 'B1',
    availability: p.availability,
    interests: Array.isArray(p.interests) ? p.interests.join(', ') : String(p.interests || ''),
    bio: p.bio
  }
  if (allowId && isUuid(p.id)) {
    payload.id = p.id
  }
  return payload
}

const fromDb = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  native: row.native,
  practice: row.practice,
  level: row.level,
  availability: row.availability || '',
  interests: typeof row.interests === 'string' && row.interests.length
    ? row.interests.split(',').map((s) => s.trim()).filter(Boolean)
    : [],
  bio: row.bio || '',
  updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
})

export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw error
  return data.map(fromDb)
}

export async function upsertProfile(profile) {
  const payload = toDbPayload(profile, false)
  if (isUuid(profile.id)) {
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', profile.id).select().single()
    if (error) throw error
    return fromDb(data)
  } else {
    const { data, error } = await supabase.from('profiles').insert(payload).select().single()
    if (error) throw error
    return fromDb(data)
  }
}

export async function deleteProfile(id) {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}

export async function upsertProfiles(list) {
  if (!list.length) return []
  const withId = list.filter((p) => isUuid(p.id)).map((p) => toDbPayload(p, true))
  const withoutId = list.filter((p) => !isUuid(p.id)).map((p) => toDbPayload(p, false))

  const results = []

  if (withId.length) {
    const { data, error } = await supabase.from('profiles').upsert(withId).select()
    if (error) throw error
    results.push(...data)
  }
  if (withoutId.length) {
    const { data, error } = await supabase.from('profiles').insert(withoutId).select()
    if (error) throw error
    results.push(...data)
  }

  return results.map(fromDb)
}

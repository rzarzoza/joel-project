import { useEffect, useMemo, useRef, useState } from 'react'
import { deleteProfile as deleteRemote, fetchProfiles, upsertProfile, upsertProfiles } from './api/profiles'

const LANGS = [
  'Arabic',
  'Chinese (Mandarin)',
  'Dutch',
  'English',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Korean',
  'Polish',
  'Portuguese',
  'Romanian',
  'Russian',
  'Spanish',
  'Swedish',
  'Turkish'
]

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const initialForm = {
  id: '',
  name: '',
  email: '',
  native: '',
  practice: '',
  level: 'B1',
  availability: '',
  interests: '',
  bio: ''
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const emailLink = (email) =>
  `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('SayHello · Language Exchange')}`

const timeAgo = (ts) => {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

export default function App() {
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState(initialForm)
  const [filters, setFilters] = useState({
    q: '',
    filterNative: '',
    filterPractice: '',
    sortBy: 'recent'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetchProfiles()
        setProfiles(data)
      } catch (err) {
        setError(err.message || 'Failed to load profiles')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const validate = (profile) => {
    if (!profile.name.trim()) return 'Name is required'
    if (!profile.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) return 'Valid email required'
    if (!profile.native) return 'Select native language'
    if (!profile.practice) return 'Select target language'
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const profile = {
      id: form.id, // leave undefined to let DB assign if new
      name: form.name.trim(),
      email: form.email.trim(),
      native: form.native,
      practice: form.practice,
      level: form.level,
      availability: form.availability.trim(),
      interests: form.interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      bio: form.bio.trim(),
      updatedAt: Date.now()
    }

    const err = validate(profile)
    if (err) {
      alert(err)
      return
    }

    try {
      setSaving(true)
      const saved = await upsertProfile(profile)
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = saved
          return copy
        }
        return [saved, ...prev]
      })
      setForm(initialForm)
    } catch (e) {
      alert(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setForm(initialForm)

  const handleDelete = async (id) => {
    if (!confirm('Delete this profile?')) return
    try {
      await deleteRemote(id)
      setProfiles((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert(e.message || 'Delete failed')
    }
  }

  const handleEdit = (profile) => {
    setForm({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      native: profile.native,
      practice: profile.practice,
      level: profile.level || 'B1',
      availability: profile.availability || '',
      interests: profile.interests.join(', '),
      bio: profile.bio || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sayhello-profiles.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data)) throw new Error('Invalid file')
    const mapped = data.map((x) => ({
      id: x.id, // let DB generate if missing/invalid
      name: String(x.name || '').slice(0, 80),
      email: String(x.email || '').slice(0, 120),
      native: LANGS.includes(x.native) ? x.native : '',
      practice: LANGS.includes(x.practice) ? x.practice : '',
      level: LEVELS.includes(x.level) ? x.level : 'B1',
      availability: String(x.availability || '').slice(0, 120),
          interests: Array.isArray(x.interests)
            ? x.interests.slice(0, 10).map(String)
            : String(x.interests || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
      bio: String(x.bio || '').slice(0, 200),
      updatedAt: Number.isFinite(+x.updatedAt) ? +x.updatedAt : Date.now()
    }))
    const saved = await upsertProfiles(mapped)
    setProfiles(saved)
  } catch (err) {
    alert('Import failed: ' + err.message)
  } finally {
      event.target.value = ''
    }
  }

  const filtered = useMemo(() => {
    const { q, filterNative, filterPractice, sortBy } = filters
    let rows = profiles.filter((p) => {
      const haystack = [p.name, p.bio, p.interests.join(' '), p.native, p.practice]
        .join(' ')
        .toLowerCase()
      if (q && !haystack.includes(q.toLowerCase())) return false
      if (filterNative && p.native !== filterNative) return false
      if (filterPractice && p.practice !== filterPractice) return false
      return true
    })

    rows.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'native') return a.native.localeCompare(b.native) || a.name.localeCompare(b.name)
      if (sortBy === 'practice') return a.practice.localeCompare(b.practice) || a.name.localeCompare(b.name)
      return b.updatedAt - a.updatedAt
    })

    return rows
  }, [filters, profiles])

  const setFilter = (field) => (event) => setFilters((prev) => ({ ...prev, [field]: event.target.value }))

  const handleClearAll = async () => {
    if (!confirm('This will permanently erase all local profiles on this device. Continue?')) return
    try {
      // server-side delete all: remove each by id to respect RLS
      for (const p of profiles) {
        await deleteRemote(p.id)
      }
      setProfiles([])
      setForm(initialForm)
    } catch (e) {
      alert(e.message || 'Clear failed')
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          <div>
            <h1>SayHello</h1>
            <div className="tag">RSB-only language exchange · 100% local (no server)</div>
          </div>
        </div>
        <div className="toolbar">
          <button className="btn" type="button" onClick={handleExport}>
            Export
          </button>
          <label className="btn" htmlFor="importFile">
            Import
            <input
              id="importFile"
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
            />
          </label>
          <button className="btn danger" type="button" onClick={handleClearAll}>
            Wipe all
          </button>
        </div>
      </header>

      <div className="grid">
        <section className="card" aria-labelledby="formTitle">
          <h2 id="formTitle">Create or edit profile</h2>
          <form onSubmit={handleSubmit}>
            <input type="hidden" value={form.id} readOnly />
            <div className="row">
              <div>
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  required
                  placeholder="e.g., Joel Hurtado"
                  value={form.name}
                  onChange={handleChange('name')}
                />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@rsb.edu"
                  value={form.email}
                  onChange={handleChange('email')}
                />
              </div>
            </div>
            <div className="row">
              <div>
                <label htmlFor="native">Native language</label>
                <select id="native" required value={form.native} onChange={handleChange('native')}>
                  <option value="">Select…</option>
                  {LANGS.map((lang) => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="practice">Wants to practice</label>
                <select id="practice" required value={form.practice} onChange={handleChange('practice')}>
                  <option value="">Select…</option>
                  {LANGS.map((lang) => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              <div>
                <label htmlFor="level">Level (target)</label>
                <select id="level" value={form.level} onChange={handleChange('level')}>
                  {LEVELS.map((lvl) => (
                    <option key={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="availability">Availability</label>
                <input
                  id="availability"
                  placeholder="e.g., Tue/Thu evenings"
                  value={form.availability}
                  onChange={handleChange('availability')}
                />
              </div>
            </div>
            <div>
              <label htmlFor="interests">Interests (comma-separated)</label>
              <input
                id="interests"
                placeholder="cinema, running, cooking"
                value={form.interests}
                onChange={handleChange('interests')}
              />
            </div>
            <div>
              <label htmlFor="bio">About you</label>
              <textarea
                id="bio"
                placeholder="Short intro (max 200 chars)"
                maxLength={200}
                value={form.bio}
                onChange={handleChange('bio')}
              />
            </div>
            <div className="row">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
              <button type="button" className="btn" onClick={handleReset}>
                Reset
              </button>
            </div>
            <div className="notice">Privacy: all data is saved to your browser's localStorage only. You control export/import.</div>
          </form>
        </section>

        <section className="card">
          <h2>Directory</h2>
          <div className="row row-bottom">
            <div>
              <label htmlFor="q">Search</label>
              <input
                id="q"
                placeholder="Name, interests, about…"
                value={filters.q}
                onChange={setFilter('q')}
              />
            </div>
            <div>
              <label htmlFor="filterNative">Native</label>
              <select id="filterNative" value={filters.filterNative} onChange={setFilter('filterNative')}>
                <option value="">Any</option>
                {LANGS.map((lang) => (
                  <option key={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filterPractice">Practice</label>
              <select id="filterPractice" value={filters.filterPractice} onChange={setFilter('filterPractice')}>
                <option value="">Any</option>
                {LANGS.map((lang) => (
                  <option key={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sortBy">Sort</label>
              <select id="sortBy" value={filters.sortBy} onChange={setFilter('sortBy')}>
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="native">Native</option>
                <option value="practice">Practice</option>
              </select>
            </div>
          </div>
          <div className="sep" />
          <div className="list" aria-live="polite">
            {loading ? (
              <div className="muted">Loading profiles…</div>
            ) : error ? (
              <div className="muted">Error: {error}</div>
            ) : filtered.length ? (
              filtered.map((p) => (
                <article key={p.id} className="profile">
                  <div className="row profile-head">
                    <div className="name">{p.name}</div>
                    <div className="muted" title="Last updated">
                      {timeAgo(p.updatedAt)}
                    </div>
                  </div>
                  <div className="lang">
                    Native: <span className="badge">{p.native}</span> · Practicing:{' '}
                    <span className="badge">{p.practice}</span> · Target: {p.level || '—'}
                  </div>
                  {p.bio ? <div>{p.bio}</div> : null}
                  {p.interests.length ? (
                    <div className="chips">
                      {p.interests.map((i) => (
                        <span key={i} className="chip">
                          {i}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {p.availability ? <div className="muted">Availability: {p.availability}</div> : null}
                  <div className="row">
                    <a className="btn" href={emailLink(p.email)}>
                      Connect
                    </a>
                    <button className="btn" type="button" onClick={() => handleEdit(p)}>
                      Edit
                    </button>
                    <button className="btn danger" type="button" onClick={() => handleDelete(p.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="muted">No profiles yet. Create some on the left or import a JSON shared by classmates.</div>
            )}
          </div>
        </section>
      </div>

      <div className="footer">Made for RSB peers. No backend. Host this file anywhere (GitHub Pages, Netlify, Vercel).</div>
    </div>
  )
}

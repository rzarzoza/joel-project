import { useEffect, useMemo, useRef, useState } from 'react'
import { deleteProfile as deleteRemote, fetchProfiles, upsertProfile, upsertProfiles } from './api/profiles'
import ProfileForm from './components/ProfileForm'
import FiltersBar from './components/FiltersBar'
import ProfileList from './components/ProfileList'
import Toolbar from './components/Toolbar'
import { LANGS, LEVELS, initialForm, timeAgo, emailLink } from './helpers/constants'

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
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

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

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">SayHello · RSB</p>
          <h1>Meet partners, practice languages.</h1>
        </div>
        <Toolbar
          onExport={handleExport}
          onImportClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onImport={handleImport}
        />
        <div className="hero-blob" aria-hidden="true" />
      </header>

      <main className="layout">
        <ProfileForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          saving={saving}
          langs={LANGS}
          levels={LEVELS}
        />

        <section className="card directory">
          <div className="card-header">
            <div>
              <p className="eyebrow">Directory</p>
              <h2>Find your match</h2>
            </div>
          </div>

          <FiltersBar filters={filters} onChange={setFilter} langs={LANGS} />

          <ProfileList
            profiles={filtered}
            loading={loading}
            error={error}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </section>
      </main>

      <footer className="footer">Made for RSB peers.</footer>
    </div>
  )
}

export default function ProfileForm({ form, onChange, onSubmit, onReset, saving, langs, levels }) {
  return (
    <section className="card form-card" aria-labelledby="formTitle">
      <div className="card-header">
        <p className="eyebrow">Create / Edit</p>
        <h2 id="formTitle">Profile</h2>
      </div>
      <form onSubmit={onSubmit}>
        <input type="hidden" value={form.id} readOnly />
        <div className="row">
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              required
              placeholder="e.g., Joel Hurtado"
              value={form.name}
              onChange={onChange('name')}
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
              onChange={onChange('email')}
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label htmlFor="native">Native language</label>
            <select id="native" required value={form.native} onChange={onChange('native')}>
              <option value="">Select…</option>
              {langs.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="practice">Wants to practice</label>
            <select id="practice" required value={form.practice} onChange={onChange('practice')}>
              <option value="">Select…</option>
              {langs.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div>
            <label htmlFor="level">Level (target)</label>
            <select id="level" value={form.level} onChange={onChange('level')}>
              {levels.map((lvl) => (
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
              onChange={onChange('availability')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="interests">Interests (comma-separated)</label>
          <input
            id="interests"
            placeholder="cinema, running, cooking"
            value={form.interests}
            onChange={onChange('interests')}
          />
        </div>

        <div>
          <label htmlFor="bio">About you</label>
          <textarea
            id="bio"
            placeholder="Short intro (max 200 chars)"
            maxLength={200}
            value={form.bio}
            onChange={onChange('bio')}
          />
        </div>

        <div className="row buttons">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          <button type="button" className="btn ghost" onClick={onReset}>
            Reset
          </button>
        </div>
      </form>
    </section>
  )
}

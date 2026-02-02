export default function FiltersBar({ filters, onChange, langs }) {
  return (
    <div className="filters row">
      <div>
        <label htmlFor="q">Search</label>
        <input
          id="q"
          placeholder="Name, interests, about…"
          value={filters.q}
          onChange={onChange('q')}
        />
      </div>
      <div>
        <label htmlFor="filterNative">Native</label>
        <select id="filterNative" value={filters.filterNative} onChange={onChange('filterNative')}>
          <option value="">Any</option>
          {langs.map((lang) => (
            <option key={lang}>{lang}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filterPractice">Practice</label>
        <select id="filterPractice" value={filters.filterPractice} onChange={onChange('filterPractice')}>
          <option value="">Any</option>
          {langs.map((lang) => (
            <option key={lang}>{lang}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sortBy">Sort</label>
        <select id="sortBy" value={filters.sortBy} onChange={onChange('sortBy')}>
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="native">Native</option>
          <option value="practice">Practice</option>
        </select>
      </div>
    </div>
  )
}

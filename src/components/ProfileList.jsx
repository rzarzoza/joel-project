import ProfileCard from './ProfileCard'

export default function ProfileList({ profiles, loading, error, page, pageSize, onPageChange }) {
  if (loading) return <div className="muted">Loading profiles…</div>
  if (error) return <div className="muted">Error: {error}</div>
  if (!profiles.length) return <div className="muted">No profiles yet.</div>

  const totalPages = Math.max(1, Math.ceil(profiles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageSlice = profiles.slice(start, start + pageSize)

  return (
    <>
      <div className="profile-grid" aria-live="polite">
        {pageSlice.map((p) => (
          <ProfileCard key={p.id} profile={p} />
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="pagination">
          <button
            className="btn ghost"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            ← Prev
          </button>
          <span className="muted">
            Page {currentPage} / {totalPages}
          </span>
          <button
            className="btn ghost"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            Next →
          </button>
        </div>
      ) : null}
    </>
  )
}

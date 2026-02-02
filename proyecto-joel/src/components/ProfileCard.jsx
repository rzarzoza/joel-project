import { emailLink, timeAgo } from '../helpers/constants'

export default function ProfileCard({ profile }) {
  return (
    <article className="profile-card">
      <div className="profile-head">
        <div>
          <p className="eyebrow small">{timeAgo(profile.updatedAt)}</p>
          <h3>{profile.name}</h3>
        </div>
        <div className="pill">{profile.level || '—'}</div>
      </div>

      <p className="lang-line">
        <span className="pill soft">Native: {profile.native}</span>
        <span className="pill soft">Practicing: {profile.practice}</span>
      </p>

      {profile.bio ? <p className="bio">{profile.bio}</p> : null}

      {profile.interests.length ? (
        <div className="chips">
          {profile.interests.map((i) => (
            <span key={i} className="chip">
              {i}
            </span>
          ))}
        </div>
      ) : null}

      {profile.availability ? <p className="muted">Availability: {profile.availability}</p> : null}

      <div className="card-actions">
        <a className="btn primary" href={emailLink(profile.email)}>
          Connect
        </a>
      </div>
    </article>
  )
}

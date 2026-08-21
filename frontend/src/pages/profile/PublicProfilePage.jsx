import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import { StarRatingDisplay } from '../../components/ui/StarRating';
import { getPublicProfile } from '../../api/users';
import { listRatingsForUser } from '../../api/misc';
import { useAuth } from '../../context/AuthContext';
import { EXPERIENCE_LEVELS, AVAILABILITY_OPTIONS, formatDate, formatRelativeTime } from '../../utils/constants';
import './ProfilePage.scss';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const { user: viewer } = useAuth();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([getPublicProfile(userId), listRatingsForUser(userId).catch(() => [])])
      .then(([p, r]) => {
        setProfile(p);
        setRatings(r);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner page />;
  if (error) return <EmptyState icon="alertTriangle" title="Couldn't load this profile" description={error} />;
  if (!profile) return null;

  const isSelf = viewer && viewer.id === profile.id;
  const experienceLabel = EXPERIENCE_LEVELS.find((e) => e.value === profile.experienceLevel)?.label;
  const availabilityLabel = AVAILABILITY_OPTIONS.find((a) => a.value === profile.availability)?.label;

  return (
    <div className="profile-page">
      {isSelf && (
        <p style={{ marginBottom: 16 }}>
          This is your public profile —{' '}
          <Link to="/profile" className="link-btn">
            edit it here
          </Link>
          .
        </p>
      )}

      <div className="public-profile-header">
        <Avatar src={profile.profilePictureUrl} name={profile.fullName} size="xl" />
        <div>
          <h1>{profile.fullName}</h1>
          <div className="detail-owner-row" style={{ marginTop: 8 }}>
            {profile.country && <span>{profile.country}</span>}
            {profile.age && <span>· {profile.age} years old</span>}
            {profile.availability && <span>· {availabilityLabel}</span>}
          </div>
          {profile.reviewCount > 0 && (
            <div className="public-profile-rating" style={{ marginTop: 8 }}>
              <StarRatingDisplay value={profile.averageRating} size={15} />
              {profile.averageRating?.toFixed(1)} ({profile.reviewCount} review{profile.reviewCount === 1 ? '' : 's'})
            </div>
          )}
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          {profile.bio && (
            <section className="card" style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 10 }}>About</h4>
              <p className="detail-body-text">{profile.bio}</p>
            </section>
          )}

          {profile.skills?.length > 0 && (
            <section className="card" style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12 }}>Skills</h4>
              <div className="skill-picker">
                {profile.skills.map((s) => (
                  <span key={s.id} className="skill-chip">
                    {s.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {profile.portfolioLinks?.length > 0 && (
            <section className="card" style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12 }}>Portfolio</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.portfolioLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="portfolio-link-row" style={{ textDecoration: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2563eb' }}>
                      <span className="badge badge-neutral">{link.platform}</span>
                      {link.url}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {ratings.length > 0 && (
            <section className="card">
              <h4 style={{ marginBottom: 16 }}>Reviews</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ratings.map((r) => (
                  <div key={r.id} style={{ paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <StarRatingDisplay value={r.stars} size={14} />
                      <span className="text-muted" style={{ fontSize: 12 }}>{formatRelativeTime(r.createdAt)}</span>
                    </div>
                    {r.feedback && <p className="detail-body-text">{r.feedback}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="sticky-side">
          <div className="card">
            <h4 style={{ marginBottom: 12 }}>Experience</h4>
            {experienceLabel && (
              <div style={{ marginBottom: 8, fontSize: 13 }}>
                <strong>{experienceLabel}</strong>
                {profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined && (
                  <span className="text-muted"> · {profile.yearsOfExperience} yrs</span>
                )}
              </div>
            )}
          </div>
          <div className="card">
            <h4 style={{ marginBottom: 10 }}>Track record</h4>
            <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
              <div className="stat-tile" style={{ border: 'none', padding: 0 }}>
                <div className="stat-value" style={{ fontSize: 22 }}>{profile.projectsCompleted}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-tile" style={{ border: 'none', padding: 0 }}>
                <div className="stat-value" style={{ fontSize: 22 }}>{formatDate(profile.createdAt)}</div>
                <div className="stat-label">Joined</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

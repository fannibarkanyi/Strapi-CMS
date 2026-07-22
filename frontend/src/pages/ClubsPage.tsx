import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Club } from '../types';
import { strapiClient } from '../tools/strapiClient';
import { ClubDetail } from '../components/ClubDetail';
import { useUser } from '../context/UserContext';

const BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL as string) || 'http://localhost:3001';

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'No date';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function ClubsPage() {
  const { user } = useUser();
  const canSubmit = user?.role?.type === 'student' || user?.role?.type === 'ambassador';
  const location = useLocation();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Club | null>(
    (location.state as { club?: Club } | null)?.club ?? null
  );
  const [returnTo] = useState(() => (location.state as { from?: string } | null)?.from);

  useEffect(() => {
    setLoading(true);
    strapiClient
      .get<Club[]>('/api/clubs?populate[cover_image]=true&populate[owner]=true&populate[location]=true&populate[tags]=true')
      .then(res => setClubs(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return <ClubDetail club={selected} onBack={() => returnTo ? navigate(returnTo) : setSelected(null)} />;
  }

  const count = clubs.length;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-row">
          <div>
            <h1>Clubs</h1>
            <p className="page-subtitle">
              {loading ? 'Loading…' : `${count} club${count !== 1 ? 's' : ''} found`}
            </p>
          </div>
          {canSubmit && <Link className="btn btn-primary" to="/submit/club">Submit Club</Link>}
        </div>
      </div>

      {!loading && count > 0 ? (
        <div className="cards-grid">
          {clubs.map(club => (
            <div className="card card-clickable" key={club.documentId} onClick={() => setSelected(club)}>
              {club.cover_image && (
                <div className="card-image">
                  <img src={`${BASE_URL}${club.cover_image.url}`} alt={club.title ?? ''} />
                </div>
              )}
              <span className="card-badge">Club</span>
              <div className="card-title">{club.title ?? 'Untitled'}</div>
              {user && <div className="card-meta">{formatDate(club.date)}</div>}
              <span className="card-arrow">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <h3>{loading ? 'Loading…' : 'No clubs found'}</h3>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import type { Club } from '../types';
import { strapiClient } from '../tools/strapiClient';
import { ClubDetail } from '../components/ClubDetail';

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'No date';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function ClubsPage({ loggedIn }: { loggedIn: boolean }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Club | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    setLoading(true);
    strapiClient
      .get<Club[]>('/api/clubs?populate[cover_image]=true&populate[owner]=true&populate[location]=true')
      .then(res => setClubs(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loggedIn]);

  if (selected) {
    return <ClubDetail club={selected} onBack={() => setSelected(null)} />;
  }

  const count = clubs.length;

  return (
    <>
      <div className="page-heading">
        <h1>Clubs</h1>
        <p className="page-subtitle">
          {loading ? 'Loading…' : `${count} club${count !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {!loading && count > 0 ? (
        <div className="cards-grid">
          {clubs.map(club => (
            <div className="card card-clickable" key={club.documentId} onClick={() => setSelected(club)}>
              <span className="card-badge">Club</span>
              <div className="card-title">{club.title ?? 'Untitled'}</div>
              <div className="card-meta">{formatDate(club.date)}</div>
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

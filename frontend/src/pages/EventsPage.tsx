import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import { strapiClient } from '../tools/strapiClient';
import { EventDetail } from '../components/EventDetail';
import { useUser } from '../context/UserContext';

const BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL as string) || 'http://localhost:3001';

const POPULATE_QUERY =
  'populate[location]=true' +
  '&populate[tags]=true' +
  '&populate[event_managers]=true' +
  '&populate[schedule]=true' +
  '&populate[submitted_by]=true' +
  '&populate[cover_image]=true';

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return 'No date';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function EventsPage({ loggedIn }: { loggedIn: boolean }) {
  const { user } = useUser();
  const canSubmit = user?.role?.type === 'student' || user?.role?.type === 'ambassador';
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Event | null>(
    (location.state as { event?: Event } | null)?.event ?? null
  );
  const [returnTo] = useState(() => (location.state as { from?: string } | null)?.from);

  useEffect(() => {
    setLoading(true);
    strapiClient
      .get<Event[]>(`/api/events?${POPULATE_QUERY}`)
      .then(res => setEvents(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loggedIn]);

  if (selected) {
    return <EventDetail event={selected} onBack={() => returnTo ? navigate(returnTo) : setSelected(null)} />;
  }

  const count = events.length;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-row">
          <div>
            <h1>Events</h1>
            <p className="page-subtitle">
              {loading ? 'Loading…' : `${count} event${count !== 1 ? 's' : ''} found`}
              {!loggedIn && ' — sign in to see events for enrolled students'}
            </p>
          </div>
          {canSubmit && <Link className="btn btn-primary" to="/submit/event">Submit Event</Link>}
        </div>
      </div>

      {!loading && count > 0 ? (
        <div className="cards-grid">
          {events.map(event => (
            <div className="card card-clickable" key={event.documentId} onClick={() => setSelected(event)}>
              {event.cover_image && (
                <div className="card-image">
                  <img src={`${BASE_URL}${event.cover_image.url}`} alt={event.name ?? ''} />
                </div>
              )}
              <span className="card-badge">{event.is_public ? 'Public' : 'Students only'}</span>
              <div className="card-title">{event.name ?? 'Untitled'}</div>
              <div className="card-meta">{formatDateTime(event.schedule?.start_datetime ?? null)}</div>
              <span className="card-arrow">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <h3>{loading ? 'Loading…' : 'No events found'}</h3>
        </div>
      )}
    </>
  );
}

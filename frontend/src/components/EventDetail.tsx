import type { Event } from '../types';
import { BlocksRenderer } from './BlocksRenderer';

const BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL as string) || 'http://localhost:3001';

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function EventDetail({ event, onBack }: { event: Event; onBack: () => void }) {
  return (
    <div className="detail-view">
      <button className="detail-back" onClick={onBack}>← Back</button>

      {event.cover_image && (
        <div className="detail-cover">
          <img src={`${BASE_URL}${event.cover_image.url}`} alt={event.name ?? ''} />
        </div>
      )}

      <div className="detail-header">
        <span className="card-badge">{event.is_public ? 'Public' : 'Students only'}</span>
        <h1>{event.name ?? 'Untitled'}</h1>
      </div>

      <div className="detail-meta">
        <div className="meta-chip">
          <span className="meta-label">Starts</span>
          <span className="meta-value">{formatDateTime(event.schedule?.start_datetime ?? null)}</span>
        </div>
        <div className="meta-chip">
          <span className="meta-label">Ends</span>
          <span className="meta-value">{formatDateTime(event.schedule?.end_datetime ?? null)}</span>
        </div>
        {event.schedule?.timezone && (
          <div className="meta-chip">
            <span className="meta-label">Timezone</span>
            <span className="meta-value">{event.schedule.timezone}</span>
          </div>
        )}
        <div className="meta-chip">
          <span className="meta-label">Capacity</span>
          <span className="meta-value">
            {event.registered_count ?? 0}{event.capacity ? ` / ${event.capacity}` : ''}
          </span>
        </div>
      </div>

      {event.location ? (
        <div className="detail-meta">
          <div className="meta-chip">
            <span className="meta-label">Address</span>
            <span className="meta-value">{event.location.address ?? '—'}</span>
          </div>
          {event.location.building && (
            <div className="meta-chip">
              <span className="meta-label">Building</span>
              <span className="meta-value">{event.location.building}</span>
            </div>
          )}
          {event.location.room_number && (
            <div className="meta-chip">
              <span className="meta-label">Room</span>
              <span className="meta-value">{event.location.room_number}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="meta-chip">
          <span className="meta-label">Location</span>
          <span className="meta-value meta-tbd">Not set</span>
        </div>
      )}

      {event.tags && event.tags.length > 0 && (
        <div className="detail-meta">
          {event.tags.map(tag => (
            <span className="card-badge" key={tag.documentId}>{tag.name}</span>
          ))}
        </div>
      )}

      {event.event_managers && event.event_managers.length > 0 && (
        <div className="detail-meta">
          <div className="meta-chip">
            <span className="meta-label">Event manager{event.event_managers.length !== 1 ? 's' : ''}</span>
            <span className="meta-value">
              {event.event_managers.map(m => m.username).join(', ')}
            </span>
          </div>
        </div>
      )}

      <div className="detail-body">
        <BlocksRenderer blocks={event.body} />
      </div>
    </div>
  );
}

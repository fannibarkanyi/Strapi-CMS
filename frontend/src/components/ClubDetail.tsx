import { useState } from 'react';
import type { Club } from '../types';
import { BlocksRenderer } from './BlocksRenderer';
import { useUser } from '../context/UserContext';

const BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL as string) || 'http://localhost:3001';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function ClubDetail({ club, onBack }: { club: Club; onBack: () => void }) {
  const { user } = useUser();
  const [joinRequested, setJoinRequested] = useState(false);

  return (
    <div className="detail-view">
      <button className="detail-back" onClick={onBack}>← Back</button>

      {club.cover_image && (
        <div className="detail-cover">
          <img src={`${BASE_URL}${club.cover_image.url}`} alt={club.title ?? ''} />
        </div>
      )}

      <div className="detail-header">
        <span className="card-badge">Club</span>
        <h1>{club.title ?? 'Untitled'}</h1>
      </div>

      {user && (
        <div className="detail-meta">
          <div className="meta-chip">
            <span className="meta-label">Date</span>
            <span className="meta-value">{formatDate(club.date)}</span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Time</span>
            <span className={`meta-value${club.time ? '' : ' meta-tbd'}`}>
              {club.time ? club.time.slice(0, 5) : '—'}
            </span>
          </div>
          {club.location ? (
            <>
              <div className="meta-chip">
                <span className="meta-label">Address</span>
                <span className="meta-value">{club.location.address ?? '—'}</span>
              </div>
              {club.location.building && (
                <div className="meta-chip">
                  <span className="meta-label">Building</span>
                  <span className="meta-value">{club.location.building}</span>
                </div>
              )}
              {club.location.room_number && (
                <div className="meta-chip">
                  <span className="meta-label">Room</span>
                  <span className="meta-value">{club.location.room_number}</span>
                </div>
              )}
            </>
          ) : (
            <div className="meta-chip">
              <span className="meta-label">Location</span>
              <span className="meta-value meta-tbd">Not set</span>
            </div>
          )}
          {club.owner && (
            <div className="meta-chip">
              <span className="meta-label">Owner</span>
              <span className="meta-value">{club.owner.username}</span>
            </div>
          )}
        </div>
      )}

      {club.tags && club.tags.length > 0 && (
        <div className="detail-meta">
          {club.tags.map(tag => (
            <span className="card-badge" key={tag.documentId}>{tag.name}</span>
          ))}
        </div>
      )}

      <div className="detail-body">
        <BlocksRenderer blocks={club.body} />
      </div>

      {user && (
        <div className="join-section">
          {joinRequested ? (
            <div className="join-success">
              <span className="join-check">✓</span>
              Your request to join has been sent. We'll be in touch!
            </div>
          ) : (
            <div className="join-card">
              <div>
                <p className="join-title">Interested in joining?</p>
                <p className="join-sub">Send a request and we'll get back to you.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setJoinRequested(true)}>
                Request to Join
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

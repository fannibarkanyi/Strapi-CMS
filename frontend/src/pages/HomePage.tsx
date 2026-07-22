import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event, Club, Article } from '../types';
import { strapiClient } from '../tools/strapiClient';

const BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL as string) || 'http://localhost:3001';

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'No date';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const LATEST = 'sort=publishedAt:desc&pagination[limit]=1';

export function HomePage() {
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const requests = [
      strapiClient
        .get<Event[]>(`/api/events?${LATEST}&populate[location]=true&populate[schedule]=true&populate[tags]=true&populate[cover_image]=true`)
        .then(res => setEvent(res.data?.[0] ?? null)),
      strapiClient
        .get<Club[]>(`/api/clubs?${LATEST}&populate[cover_image]=true&populate[owner]=true&populate[location]=true&populate[tags]=true`)
        .then(res => setClub(res.data?.[0] ?? null)),
      strapiClient
        .get<Article[]>(`/api/articles?${LATEST}&populate=*`)
        .then(res => setArticle(res.data?.[0] ?? null)),
    ];

    Promise.allSettled(requests).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-heading">
        <h1>Welcome to SRH Ambassadors</h1>
        <p className="page-subtitle">The latest event, club and news, all in one place.</p>
      </div>

      <div className="cards-grid">
        <div className="card card-clickable" onClick={() => navigate('/events', event ? { state: { event, from: '/' } } : undefined)}>
          {event?.cover_image && (
            <div className="card-image">
              <img src={`${BASE_URL}${event.cover_image.url}`} alt={event.name ?? ''} />
            </div>
          )}
          <span className="card-badge">Latest Event</span>
          {event ? (
            <>
              <div className="card-title">{event.name ?? 'Untitled'}</div>
              <div className="card-meta">{formatDate(event.schedule?.start_datetime ?? null)}</div>
            </>
          ) : (
            <div className="card-description">{loading ? 'Loading…' : 'No events yet.'}</div>
          )}
          <span className="card-arrow">→</span>
        </div>

        <div className="card card-clickable" onClick={() => navigate('/clubs', club ? { state: { club, from: '/' } } : undefined)}>
          {club?.cover_image && (
            <div className="card-image">
              <img src={`${BASE_URL}${club.cover_image.url}`} alt={club.title ?? ''} />
            </div>
          )}
          <span className="card-badge">Latest Club</span>
          {club ? (
            <>
              <div className="card-title">{club.title ?? 'Untitled'}</div>
              <div className="card-meta">{formatDate(club.date)}</div>
            </>
          ) : (
            <div className="card-description">{loading ? 'Loading…' : 'No clubs yet.'}</div>
          )}
          <span className="card-arrow">→</span>
        </div>

        <div className="card card-clickable" onClick={() => navigate('/articles', article ? { state: { article, from: '/' } } : undefined)}>
          {article?.cover && (
            <div className="card-image">
              <img src={`${BASE_URL}${article.cover.url}`} alt={article.title ?? ''} />
            </div>
          )}
          <span className="card-badge">Latest News</span>
          {article ? (
            <>
              <div className="card-title">{article.title ?? 'Untitled'}</div>
              {article.description && <div className="card-description">{article.description}</div>}
              <div className="card-meta">{formatDate(article.publishedAt)}</div>
            </>
          ) : (
            <div className="card-description">{loading ? 'Loading…' : 'No news yet.'}</div>
          )}
          <span className="card-arrow">→</span>
        </div>
      </div>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { strapiClient } from '../tools/strapiClient';
import { useUser } from '../context/UserContext';
import type { Article, Club, Event, ReviewStatus } from '../types';

type Kind = 'Event' | 'Club' | 'Article';

interface Item {
  kind: Kind;
  documentId: string;
  title: string;
  reviewStatus: ReviewStatus;
  meta: string;
  editPath: string;
  data: Event | Club | Article;
}

const KIND_TO_ENDPOINT: Record<Kind, string> = {
  Event: 'events',
  Club: 'clubs',
  Article: 'articles',
};

const KIND_TO_VIEW: Record<Kind, { path: string; stateKey: 'event' | 'club' | 'article' }> = {
  Event: { path: '/events', stateKey: 'event' },
  Club: { path: '/clubs', stateKey: 'club' },
  Article: { path: '/articles', stateKey: 'article' },
};

export function ProfilePage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const isAmbassador = user?.role?.type === 'ambassador';

  const loadQueue = useCallback(async () => {
    const [events, clubs, articles] = await Promise.all([
      strapiClient.get<Event[]>(
        '/api/events?status=draft&filters[review_status][$eq]=Sent' +
        '&populate[submitted_by]=true&populate[location]=true&populate[schedule]=true' +
        '&populate[tags]=true&populate[event_managers]=true'
      ),
      strapiClient.get<Club[]>(
        '/api/clubs?status=draft&filters[review_status][$eq]=Sent' +
        '&populate[owner]=true&populate[location]=true&populate[cover_image]=true&populate[tags]=true'
      ),
      strapiClient.get<Article[]>(
        '/api/articles?status=draft&filters[review_status][$eq]=Sent' +
        '&populate[author]=true&populate[tags]=true&populate[cover]=true'
      ),
    ]);

    const list: Item[] = [
      ...(events.data ?? []).map(e => ({
        kind: 'Event' as const,
        documentId: e.documentId,
        title: e.name ?? 'Untitled',
        reviewStatus: e.review_status,
        meta: e.submitted_by?.username ? `Submitted by ${e.submitted_by.username}` : '',
        editPath: '',
        data: e,
      })),
      ...(clubs.data ?? []).map(c => ({
        kind: 'Club' as const,
        documentId: c.documentId,
        title: c.title ?? 'Untitled',
        reviewStatus: c.review_status,
        meta: c.owner?.username ? `Submitted by ${c.owner.username}` : '',
        editPath: '',
        data: c,
      })),
      ...(articles.data ?? []).map(a => ({
        kind: 'Article' as const,
        documentId: a.documentId,
        title: a.title ?? 'Untitled',
        reviewStatus: a.review_status,
        meta: a.author?.username ? `Submitted by ${a.author.username}` : '',
        editPath: '',
        data: a,
      })),
    ];
    setItems(list);
  }, []);

  const loadMySubmissions = useCallback(async () => {
    if (!user) return;
    const [draftEvents, draftClubs, draftArticles] = await Promise.all([
      strapiClient.get<Event[]>(
        '/api/events?status=draft&populate[location]=true&populate[schedule]=true' +
        '&populate[tags]=true&populate[event_managers]=true'
      ),
      strapiClient.get<Club[]>('/api/clubs?status=draft&populate[location]=true&populate[cover_image]=true&populate[tags]=true'),
      strapiClient.get<Article[]>('/api/articles?status=draft&populate[tags]=true&populate[cover]=true'),
    ]);

    const list: Item[] = [
      ...(draftEvents.data ?? []).map(e => ({
        kind: 'Event' as const,
        documentId: e.documentId,
        title: e.name ?? 'Untitled',
        reviewStatus: e.review_status,
        meta: '',
        editPath: `/submit/event?edit=${e.documentId}`,
        data: e,
      })),
      ...(draftClubs.data ?? []).map(c => ({
        kind: 'Club' as const,
        documentId: c.documentId,
        title: c.title ?? 'Untitled',
        reviewStatus: c.review_status,
        meta: '',
        editPath: `/submit/club?edit=${c.documentId}`,
        data: c,
      })),
      ...(draftArticles.data ?? []).map(a => ({
        kind: 'Article' as const,
        documentId: a.documentId,
        title: a.title ?? 'Untitled',
        reviewStatus: a.review_status,
        meta: '',
        editPath: `/submit/article?edit=${a.documentId}`,
        data: a,
      })),
    ];
    setItems(list);
  }, [user]);

  const load = useCallback(() => {
    setLoading(true);
    const task = isAmbassador ? loadQueue() : loadMySubmissions();
    task.catch(() => {}).finally(() => setLoading(false));
  }, [isAmbassador, loadQueue, loadMySubmissions]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (item: Item, action: 'approve' | 'decline') => {
    await strapiClient.post(`/api/${KIND_TO_ENDPOINT[item.kind]}/${item.documentId}/${action}`, {});
    load();
  };

  const viewItem = (item: Item) => {
    const { path, stateKey } = KIND_TO_VIEW[item.kind];
    navigate(path, { state: { [stateKey]: item.data, from: '/profile' } });
  };

  const handleLogout = () => {
    strapiClient.logout();
    // A full reload (rather than client-side nav + clearing context state)
    // sidesteps a route-guard race: clearing `user` while still mounted on
    // the protected "/profile" route can make its own not-logged-in
    // redirect fire and win, landing on "/login" instead of home.
    window.location.href = '/';
  };

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-row">
          <div>
            {user?.username && <p className="page-subtitle">Hi {user.username}</p>}
            <h1>{isAmbassador ? 'Pending Review' : 'My Submissions'}</h1>
            <p className="page-subtitle">
              {loading
                ? 'Loading…'
                : isAmbassador
                  ? `${items.length} submission${items.length !== 1 ? 's' : ''} waiting for review`
                  : `${items.length} submission${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {!loading && items.length > 0 ? (
        <div className="cards-grid">
          {items.map(item => (
            <div className="card card-clickable" key={`${item.kind}-${item.documentId}`} onClick={() => viewItem(item)}>
              <span className="card-badge">{item.kind}</span>
              <div className="card-title">{item.title}</div>
              <span className="card-badge">{item.reviewStatus}</span>
              {item.meta && <div className="card-meta">{item.meta}</div>}

              {isAmbassador ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-primary" onClick={() => act(item, 'approve')}>Approve</button>
                  <button className="btn btn-outline" onClick={() => act(item, 'decline')}>Decline</button>
                </div>
              ) : item.reviewStatus === 'Declined' && item.editPath ? (
                <button
                  className="btn btn-outline"
                  onClick={e => { e.stopPropagation(); navigate(item.editPath); }}
                  style={{ marginTop: 8 }}
                >
                  Edit & Resubmit
                </button>
              ) : null}
              <span className="card-arrow">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <h3>{loading ? 'Loading…' : isAmbassador ? 'Nothing pending review' : "You haven't submitted anything yet"}</h3>
        </div>
      )}
    </>
  );
}

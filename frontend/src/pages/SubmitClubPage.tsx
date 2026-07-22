import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Block, Club, Tag } from '../types';
import { strapiClient } from '../tools/strapiClient';
import { useUser } from '../context/UserContext';

interface LocationOption {
  documentId: string;
  address: string | null;
  building: string | null;
}

function toBlocks(text: string): Block[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return [{ type: 'paragraph', children: [{ type: 'text', text: trimmed }] }];
}

// <input type="time"> yields "HH:mm", but Strapi's `time` field requires
// the full "HH:mm:ss.SSS" format.
function toApiTime(time: string): string | null {
  return time ? `${time}:00.000` : null;
}

export function SubmitClubPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationId, setLocationId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    strapiClient
      .get<LocationOption[]>('/api/locations')
      .then(res => setLocations(res.data ?? []))
      .catch(() => {});
    strapiClient
      .get<Tag[]>('/api/tags?pagination[pageSize]=100&sort=name:asc')
      .then(res => setTags(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    strapiClient
      .get<Club>(`/api/clubs/${editId}?status=draft&populate[location]=true&populate[tags]=true`)
      .then(res => {
        const club = res.data;
        setTitle(club.title ?? '');
        setDate(club.date ?? '');
        setTime(club.time?.slice(0, 5) ?? '');
        setLocationId(club.location?.documentId ?? '');
        setSelectedTags(club.tags?.map(t => t.documentId) ?? []);
      })
      .catch(() => {});
  }, [editId]);

  const isAmbassador = user?.role?.type === 'ambassador';

  const toggleTag = (documentId: string) => {
    setSelectedTags(prev =>
      prev.includes(documentId) ? prev.filter(id => id !== documentId) : [...prev, documentId]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const data = {
        title: title.trim(),
        date: date || null,
        time: toApiTime(time),
        location: locationId || null,
        tags: selectedTags,
        ...(body.trim() ? { body: toBlocks(body) } : {}),
      };
      if (editId) {
        await strapiClient.put(`/api/clubs/${editId}`, { data });
      } else {
        await strapiClient.post('/api/clubs', { data });
      }
      navigate('/profile', { replace: true });
    } catch {
      setError('Something went wrong submitting your club. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <h1>{editId ? 'Edit & Resubmit Club' : 'Submit a Club'}</h1>
        <p className="page-subtitle">
          {isAmbassador
            ? 'This will be published immediately.'
            : editId
              ? 'Resubmitting will send this back to an ambassador for review.'
              : 'An ambassador will review this before it goes live.'}
        </p>
      </div>

      <form className="login-form" onSubmit={submit} style={{ maxWidth: 560 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="title">Club name</label>
          <input
            id="title"
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            className="form-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            className="form-input"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="location">Location</label>
          <select
            id="location"
            className="form-input"
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
          >
            <option value="">Not set</option>
            {locations.map(l => (
              <option key={l.documentId} value={l.documentId}>
                {l.address}{l.building ? ` — ${l.building}` : ''}
              </option>
            ))}
          </select>
        </div>

        {tags.length > 0 && (
          <div className="form-group">
            <label className="form-label">Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map(tag => (
                <label key={tag.documentId} className="card-badge" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.documentId)}
                    onChange={() => toggleTag(tag.documentId)}
                    style={{ marginRight: 4 }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="body">Description</label>
          <textarea
            id="body"
            className="form-textarea"
            rows={8}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : isAmbassador ? 'Publish' : editId ? 'Resubmit for review' : 'Submit for review'}
        </button>
      </form>
    </>
  );
}

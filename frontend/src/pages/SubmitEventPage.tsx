import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Block, Event, Tag } from '../types';
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

function toDatetimeLocal(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SubmitEventPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
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
      .get<Event>(`/api/events/${editId}?status=draft&populate[location]=true&populate[tags]=true`)
      .then(res => {
        const event = res.data;
        setName(event.name ?? '');
        setCapacity(event.capacity != null ? String(event.capacity) : '');
        setIsPublic(event.is_public);
        setStartDatetime(toDatetimeLocal(event.schedule?.start_datetime ?? null));
        setEndDatetime(toDatetimeLocal(event.schedule?.end_datetime ?? null));
        setLocationId(event.location?.documentId ?? '');
        setSelectedTags(event.tags?.map(t => t.documentId) ?? []);
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
    if (!name.trim() || !startDatetime) return;
    setSubmitting(true);
    setError('');
    try {
      const data = {
        name: name.trim(),
        capacity: capacity ? Number(capacity) : null,
        is_public: isPublic,
        location: locationId || null,
        tags: selectedTags,
        schedule: {
          start_datetime: new Date(startDatetime).toISOString(),
          end_datetime: endDatetime ? new Date(endDatetime).toISOString() : null,
        },
        ...(body.trim() ? { body: toBlocks(body) } : {}),
      };
      if (editId) {
        await strapiClient.put(`/api/events/${editId}`, { data });
      } else {
        await strapiClient.post('/api/events', { data });
      }
      navigate('/profile', { replace: true });
    } catch {
      setError('Something went wrong submitting your event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <h1>{editId ? 'Edit & Resubmit Event' : 'Submit an Event'}</h1>
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
          <label className="form-label" htmlFor="name">Event name</label>
          <input
            id="name"
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="start">Starts</label>
          <input
            id="start"
            type="datetime-local"
            className="form-input"
            value={startDatetime}
            onChange={e => setStartDatetime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="end">Ends</label>
          <input
            id="end"
            type="datetime-local"
            className="form-input"
            value={endDatetime}
            onChange={e => setEndDatetime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="capacity">Capacity</label>
          <input
            id="capacity"
            type="number"
            min={0}
            className="form-input"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
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

        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Open to the public (unchecked = students only)
          </label>
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

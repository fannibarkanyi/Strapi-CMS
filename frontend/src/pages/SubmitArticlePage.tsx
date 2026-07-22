import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Article, Block, Tag } from '../types';
import { strapiClient } from '../tools/strapiClient';
import { useUser } from '../context/UserContext';

function toBlocks(text: string): Block[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return [{ type: 'paragraph', children: [{ type: 'text', text: trimmed }] }];
}

export function SubmitArticlePage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [tags, setTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    strapiClient
      .get<Tag[]>('/api/tags?pagination[pageSize]=100&sort=name:asc')
      .then(res => setTags(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    strapiClient
      .get<Article>(`/api/articles/${editId}?status=draft&populate[tags]=true`)
      .then(res => {
        const article = res.data;
        setTitle(article.title ?? '');
        setDescription(article.description ?? '');
        setSelectedTags(article.tags?.map(t => t.documentId) ?? []);
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
        description: description.trim() || null,
        tags: selectedTags,
        ...(body.trim() ? { body: toBlocks(body) } : {}),
      };
      if (editId) {
        await strapiClient.put(`/api/articles/${editId}`, { data });
      } else {
        await strapiClient.post('/api/articles', { data });
      }
      navigate('/profile', { replace: true });
    } catch {
      setError('Something went wrong submitting your article. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <h1>{editId ? 'Edit & Resubmit Article' : 'Submit an Article'}</h1>
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
          <label className="form-label" htmlFor="title">Title</label>
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
          <label className="form-label" htmlFor="description">Short description</label>
          <input
            id="description"
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
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
          <label className="form-label" htmlFor="body">Article body</label>
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

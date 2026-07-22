import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Article } from '../types';
import { strapiClient } from '../tools/strapiClient';
import { ArticleDetail } from '../components/ArticleDetail';
import { useUser } from '../context/UserContext';

const BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL as string) || 'http://localhost:3001';

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'No date';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function ArticlesPage() {
  const { user } = useUser();
  const canSubmit = user?.role?.type === 'student' || user?.role?.type === 'ambassador';
  const location = useLocation();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Article | null>(
    (location.state as { article?: Article } | null)?.article ?? null
  );
  const [returnTo] = useState(() => (location.state as { from?: string } | null)?.from);

  useEffect(() => {
    setLoading(true);
    strapiClient
      .get<Article[]>('/api/articles?populate=*')
      .then(res => setArticles(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return <ArticleDetail article={selected} onBack={() => returnTo ? navigate(returnTo) : setSelected(null)} />;
  }

  const count = articles.length;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-row">
          <div>
            <h1>Articles</h1>
            <p className="page-subtitle">
              {loading ? 'Loading…' : `${count} article${count !== 1 ? 's' : ''} found`}
            </p>
          </div>
          {canSubmit && <Link className="btn btn-primary" to="/submit/article">Submit Article</Link>}
        </div>
      </div>

      {!loading && count > 0 ? (
        <div className="cards-grid">
          {articles.map(article => (
            <div className="card card-clickable" key={article.documentId} onClick={() => setSelected(article)}>
              {article.cover && (
                <div className="card-image">
                  <img src={`${BASE_URL}${article.cover.url}`} alt={article.title ?? ''} />
                </div>
              )}
              <span className="card-badge">Article</span>
              <div className="card-title">{article.title ?? 'Untitled'}</div>
              {article.description && (
                <div className="card-description">{article.description}</div>
              )}
              <div className="card-meta">{formatDate(article.publishedAt)}</div>
              <span className="card-arrow">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <h3>{loading ? 'Loading…' : 'No articles found'}</h3>
        </div>
      )}
    </>
  );
}

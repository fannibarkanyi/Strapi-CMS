import { useEffect, useState } from 'react';
import type { Article } from '../types';
import { strapiClient } from '../tools/strapiClient';
import { ArticleDetail } from '../components/ArticleDetail';

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'No date';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function ArticlesPage({ loggedIn }: { loggedIn: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    setLoading(true);
    strapiClient
      .get<Article[]>('/api/articles?populate=*')
      .then(res => setArticles(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loggedIn]);

  if (selected) {
    return <ArticleDetail article={selected} onBack={() => setSelected(null)} />;
  }

  const count = articles.length;

  return (
    <>
      <div className="page-heading">
        <h1>Articles</h1>
        <p className="page-subtitle">
          {loading ? 'Loading…' : `${count} article${count !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {!loading && count > 0 ? (
        <div className="cards-grid">
          {articles.map(article => (
            <div className="card card-clickable" key={article.documentId} onClick={() => setSelected(article)}>
              <span className="card-badge">{article.category?.name ?? 'Article'}</span>
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

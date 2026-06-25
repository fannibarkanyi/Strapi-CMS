import { useEffect, useState } from 'react'
import './App.css'
import { strapiClient } from './tools/strapiClient';
import type { Club, Article } from './types';
import { ClubDetail } from './components/ClubDetail';
import { ArticleDetail } from './components/ArticleDetail';

type Page = 'clubs' | 'articles'

const NAV: { label: string; page: Page }[] = [
  { label: 'Clubs', page: 'clubs' },
  { label: 'Articles', page: 'articles' },
]

function App() {
  const [page, setPage] = useState<Page>('clubs')
  const [clubs, setClubs] = useState<Club[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  useEffect(() => {
    if (!loggedIn) return;
    setLoading(true)
    const req =
      page === 'clubs'
        ? strapiClient.get<Club[]>('/api/clubs?populate=*').then(res => setClubs(res.data ?? []))
        : strapiClient.get<Article[]>('/api/articles?populate=*').then(res => setArticles(res.data ?? []))
    req.catch(() => {}).finally(() => setLoading(false))
  }, [page, loggedIn])

  const login = async () => {
    await strapiClient.login("fannibarkanyi@gmail.com", "Kurvaanyad67")
    setLoggedIn(true)
  }

  const navigateTo = (p: Page) => {
    setPage(p)
    setSelectedClub(null)
    setSelectedArticle(null)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  const count = page === 'clubs' ? clubs.length : articles.length
  const noun = page === 'clubs' ? 'club' : 'article'
  const inDetail = selectedClub !== null || selectedArticle !== null

  return (
    <>
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-mark" />
          <span className="header-title">SRH Ambassadors</span>
        </div>
        <nav className="header-nav">
          {NAV.map(({ label, page: p }) => (
            <button
              key={p}
              className={`nav-item${page === p ? ' nav-item-active' : ''}`}
              onClick={() => navigateTo(p)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className={`btn ${loggedIn ? 'btn-outline' : 'btn-primary'}`} onClick={login}>
          {loggedIn ? 'Logged in' : 'Login'}
        </button>
      </header>

      <main className="main">
        {selectedClub && (
          <ClubDetail club={selectedClub} onBack={() => setSelectedClub(null)} />
        )}

        {selectedArticle && (
          <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        )}

        {!inDetail && (
          <>
            <div className="page-heading">
              <h1>{page === 'clubs' ? 'Clubs' : 'Articles'}</h1>
              <p className="page-subtitle">
                {!loggedIn ? 'Log in to see content' : loading ? 'Loading…' : `${count} ${noun}${count !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loggedIn && !loading && count > 0 ? (
              <div className="cards-grid">
                {page === 'clubs' && clubs.map((club) => (
                  <div className="card card-clickable" key={club.documentId} onClick={() => setSelectedClub(club)}>
                    <span className="card-badge">Club</span>
                    <div className="card-title">{club.title ?? 'Untitled'}</div>
                    <div className="card-meta">{formatDate(club.date)}</div>
                    <span className="card-arrow">→</span>
                  </div>
                ))}
                {page === 'articles' && articles.map((article) => (
                  <div className="card card-clickable" key={article.documentId} onClick={() => setSelectedArticle(article)}>
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
                <h3>
                  {!loggedIn ? 'Not logged in' : loading ? 'Loading…' : `No ${noun}s found`}
                </h3>
                <p>{!loggedIn ? 'Log in to see content' : ''}</p>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}

export default App

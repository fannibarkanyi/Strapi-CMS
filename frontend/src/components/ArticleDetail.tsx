import { useState } from 'react';
import type { Article, Comment } from '../types';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatCommentDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ArticleDetail({ article, onBack }: { article: Article; onBack: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [textInput, setTextInput] = useState('');

  const submitComment = () => {
    if (!textInput.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now(),
      author: nameInput.trim() || 'Anonymous',
      text: textInput.trim(),
      date: new Date().toISOString(),
    }]);
    setNameInput('');
    setTextInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment();
  };

  return (
    <div className="detail-view">
      <button className="detail-back" onClick={onBack}>← Back</button>

      <div className="detail-header">
        <span className="card-badge">{article.category?.name ?? 'Article'}</span>
        <h1>{article.title ?? 'Untitled'}</h1>
      </div>

      <div className="detail-meta">
        {article.author && (
          <div className="meta-chip">
            <span className="meta-label">Author</span>
            <span className="meta-value">{article.author.name}</span>
          </div>
        )}
        <div className="meta-chip">
          <span className="meta-label">Published</span>
          <span className="meta-value">{formatDate(article.publishedAt)}</span>
        </div>
      </div>

      {article.description && (
        <p className="detail-description">{article.description}</p>
      )}

      <div className="detail-body">
        <p className="no-content">Full article body coming soon.</p>
      </div>

      <div className="comments-section">
        <h2 className="section-title">Comments <span className="comment-count">{comments.length}</span></h2>

        {comments.length > 0 && (
          <div className="comment-list">
            {comments.map(comment => (
              <div className="comment" key={comment.id}>
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">{formatCommentDate(comment.date)}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="comment-form">
          <h3>Leave a comment</h3>
          <input
            className="form-input"
            type="text"
            placeholder="Your name (optional)"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
          />
          <textarea
            className="form-textarea"
            placeholder="Write your comment…"
            rows={4}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <div className="comment-form-footer">
            <span className="comment-hint">Ctrl+Enter to submit</span>
            <button className="btn btn-primary" onClick={submitComment}>
              Post comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

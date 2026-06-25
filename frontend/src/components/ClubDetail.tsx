import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Club, Block, BlockChild } from '../types';

const BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL as string) || 'http://localhost:3001';

function InlineNode({ node }: { node: BlockChild }): ReactNode {
  if (node.type === 'link' && node.url) {
    return (
      <a href={node.url} target="_blank" rel="noreferrer">
        {(node.children ?? []).map((c, i) => <InlineNode key={i} node={c} />)}
      </a>
    );
  }
  const text = node.text ?? '';
  if (node.code) return <code>{text}</code>;
  if (node.bold && node.italic) return <strong><em>{text}</em></strong>;
  if (node.bold) return <strong>{text}</strong>;
  if (node.italic) return <em>{text}</em>;
  if (node.underline) return <u>{text}</u>;
  if (node.strikethrough) return <s>{text}</s>;
  return <>{text}</>;
}

function BlockNode({ block }: { block: Block }): ReactNode {
  const inline = block.children.map((c, i) => <InlineNode key={i} node={c} />);

  switch (block.type) {
    case 'paragraph':
      return <p>{inline}</p>;
    case 'heading': {
      const Tag = `h${Math.min(Math.max(block.level ?? 2, 1), 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return <Tag>{inline}</Tag>;
    }
    case 'list': {
      const items = block.children.map((item, j) => (
        <li key={j}>{(item.children ?? []).map((c, k) => <InlineNode key={k} node={c} />)}</li>
      ));
      return block.format === 'ordered' ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case 'quote':
      return <blockquote>{inline}</blockquote>;
    case 'code':
      return <pre><code>{block.children.map(c => c.text ?? '').join('')}</code></pre>;
    case 'image':
      return block.image
        ? <img src={block.image.url} alt={block.image.alternativeText ?? ''} className="blocks-image" />
        : null;
    default:
      return <p>{inline}</p>;
  }
}

function BlocksRenderer({ blocks }: { blocks: Block[] | null }) {
  if (!blocks || blocks.length === 0) {
    return <p className="no-content">No description added yet.</p>;
  }
  return (
    <div className="blocks-content">
      {blocks.map((block, i) => <BlockNode key={i} block={block} />)}
    </div>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function ClubDetail({ club, onBack }: { club: Club; onBack: () => void }) {
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

      <div className="detail-meta">
        <div className="meta-chip">
          <span className="meta-label">Date</span>
          <span className="meta-value">{formatDate(club.date)}</span>
        </div>
        <div className="meta-chip">
          <span className="meta-label">Time</span>
          <span className="meta-value meta-tbd">—</span>
        </div>
        <div className="meta-chip">
          <span className="meta-label">Location</span>
          <span className="meta-value meta-tbd">—</span>
        </div>
      </div>

      <div className="detail-body">
        <BlocksRenderer blocks={club.body} />
      </div>

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
    </div>
  );
}

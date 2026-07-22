import type { ReactNode } from 'react';
import type { Block, BlockChild } from '../types';

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

export function BlocksRenderer({ blocks }: { blocks: Block[] | null }) {
  if (!blocks || blocks.length === 0) {
    return <p className="no-content">No description added yet.</p>;
  }
  return (
    <div className="blocks-content">
      {blocks.map((block, i) => <BlockNode key={i} block={block} />)}
    </div>
  );
}

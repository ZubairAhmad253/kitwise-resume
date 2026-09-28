import { Fragment } from 'react';
import { parseRichText, type Inline } from '@/lib/resume/richtext';

function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === 'text') return <Fragment key={i}>{n.text}</Fragment>;
        if (n.type === 'bold')
          return (
            <strong key={i} style={{ fontWeight: 700 }}>
              <Inlines nodes={n.children} />
            </strong>
          );
        if (n.type === 'italic')
          return (
            <em key={i}>
              <Inlines nodes={n.children} />
            </em>
          );
        return (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            <Inlines nodes={n.children} />
          </a>
        );
      })}
    </>
  );
}

/**
 * Renders the rich-text format. Templates style it through the class names:
 * `rt` on the wrapper, `rt-p` paragraphs, `rt-ul` lists, `rt-li` bullets.
 */
export function RichText({ source, className = '' }: { source: string; className?: string }) {
  const blocks = parseRichText(source);
  if (blocks.length === 0) return null;
  return (
    <div className={`rt ${className}`}>
      {blocks.map((b, i) =>
        b.type === 'paragraph' ? (
          <p key={i} className="rt-p">
            <Inlines nodes={b.children} />
          </p>
        ) : (
          <ul key={i} className="rt-ul">
            {b.items.map((it, j) => (
              <li key={j} className="rt-li">
                <Inlines nodes={it} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

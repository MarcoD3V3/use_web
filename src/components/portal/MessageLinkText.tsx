import { parseMessageLinks } from "@/lib/shared/linkify";

export function MessageLinkText({ text, className }: { text: string; className?: string }) {
  const segments = parseMessageLinks(text);
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.type === "link" ? (
          <a key={`${seg.href}-${i}`} href={seg.href} target="_blank" rel="noopener noreferrer" className="portal-chat-link">
            {seg.value}
          </a>
        ) : (
          <span key={`t-${i}`}>{seg.value}</span>
        )
      )}
    </span>
  );
}

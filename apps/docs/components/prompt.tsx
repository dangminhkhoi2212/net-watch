'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** A prompt for an AI coding assistant, with a copy button. `children` is the prompt text. */
export function Prompt({ title, children }: { title: string; children: string }) {
  const [copied, setCopied] = useState(false);
  // Prompts say YOUR-SITE where the docs site address goes. After mount the real address is filled in,
  // so a prompt copied from the deployed site works as pasted. Doing it after mount keeps the server HTML identical.
  const [origin, setOrigin] = useState<string>();
  useEffect(() => setOrigin(window.location.origin), []);
  const text = origin ? children.trim().replaceAll('https://YOUR-SITE', origin).replaceAll('YOUR-SITE', new URL(origin).host) : children.trim();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied (insecure context, permissions); the prompt stays selectable.
    }
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border bg-fd-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
        <span className="text-sm font-medium">{title}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border bg-fd-background px-2.5 py-1 text-sm font-medium transition-colors hover:bg-fd-accent"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy prompt'}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 text-sm leading-relaxed">{text}</pre>
    </div>
  );
}

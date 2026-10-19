/** A static SVG diagram from /public/diagrams, shown on a light card so it reads in dark mode too. */
export function Diagram({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="not-prose my-6">
      <div className="overflow-x-auto rounded-lg border bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="mx-auto h-auto min-w-[720px] w-full" />
      </div>
      {caption ? <figcaption className="mt-2 text-sm text-fd-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}

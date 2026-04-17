import type { VideoBlockProps } from './video.types';

export function Video({ heading, provider, videoId, caption }: VideoBlockProps) {
  const src =
    provider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : `https://player.vimeo.com/video/${videoId}`;

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        {heading ? (
          <h2 className="font-display font-semibold text-3xl text-brand-primary md:text-4xl">
            {heading}
          </h2>
        ) : null}
        <div className="relative mt-8 aspect-video overflow-hidden rounded-lg bg-brand-primary">
          <iframe
            src={src}
            title={heading ?? caption ?? 'Vidéo Mady'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        {caption ? <p className="mt-3 text-muted text-sm">{caption}</p> : null}
      </div>
    </section>
  );
}

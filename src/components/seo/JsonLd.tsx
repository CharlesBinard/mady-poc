interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  const payload = Array.isArray(data) ? { '@context': 'https://schema.org', '@graph': data } : data;
  return (
    <script
      type="application/ld+json"
      id={id}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional JSON-LD injection
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, '\\u003c'),
      }}
    />
  );
}

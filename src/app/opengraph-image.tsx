import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = "Mady — Fabricant français d'escaliers et accès industriels";

export default async function OgImage(): Promise<Response> {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#101f2b',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 28, color: '#fc4c02', letterSpacing: 6 }}>MADY</div>
      <div>
        <div style={{ fontSize: 80, fontWeight: 600, lineHeight: 1.05 }}>
          Escaliers et accès industriels.
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Fabricant français. Conforme NF E85-015 · EN ISO 14122 · NF EN 1090.
        </div>
      </div>
      <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }}>mady.fr</div>
    </div>,
    { ...size },
  );
}

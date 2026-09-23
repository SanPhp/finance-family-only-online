import { ImageResponse } from 'next/og';

// Ícones do PWA gerados em tempo de build: 192, 512, maskable (com margem de segurança) e apple (180).
const icons = {
  '192': { size: 192, glyph: 0.62 },
  '512': { size: 512, glyph: 0.62 },
  maskable: { size: 512, glyph: 0.46 },
  apple: { size: 180, glyph: 0.62 },
} as const;

type IconName = keyof typeof icons;

export function generateStaticParams() {
  return Object.keys(icons).map((name) => ({ name }));
}

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const icon = icons[name as IconName];
  if (!icon) return new Response('Not found', { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: icon.size * icon.glyph,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #5b21b6, #a855f7 60%, #d946ef)',
        }}
      >
        $
      </div>
    ),
    { width: icon.size, height: icon.size },
  );
}

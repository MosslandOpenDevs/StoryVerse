import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'storyverse-web',
    version: process.env['npm_package_version'] ?? '0.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
  });
}

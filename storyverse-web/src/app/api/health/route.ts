import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'storyverse-web',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

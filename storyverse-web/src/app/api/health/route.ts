import { NextResponse } from 'next/server';
import { checkNeo4jReadiness } from '@/lib/neo4j/readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  const neo4j = await checkNeo4jReadiness();
  // Configured-but-unreachable Neo4j means the app is not fully ready; an
  // unconfigured graph is an intentional degraded mode and still counts ready.
  const ready = neo4j.status !== 'down';

  return NextResponse.json(
    {
      // `ok` stays a pure liveness signal (the process is up); `ready` reflects
      // whether dependencies are actually reachable.
      ok: true,
      ready,
      service: 'storyverse-web',
      version: process.env['npm_package_version'] ?? '0.0.0',
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { neo4j },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
      },
    },
  );
}

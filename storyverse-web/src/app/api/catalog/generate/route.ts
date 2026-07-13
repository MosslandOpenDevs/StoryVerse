import { NextResponse, type NextRequest } from "next/server";
import { generateCatalogStories } from "@/lib/agents/catalogGenerator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isLocalhostHost(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env["CATALOG_GENERATE_SECRET"];
  if (!secret) {
    // Fail closed in production: a bearer secret is required to expose generation.
    // Outside production, allow local development requests only. Note the Host
    // header is client-controlled, so this is a convenience gate, not a security
    // boundary — always set CATALOG_GENERATE_SECRET for any deployed environment.
    if (process.env.NODE_ENV === "production") {
      return false;
    }
    return isLocalhostHost(request);
  }

  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const countPerDomain = Math.min(
    Math.max(Number(body["countPerDomain"]) || 4, 1),
    10,
  );

  const result = await generateCatalogStories(countPerDomain);

  return NextResponse.json({
    generated: result.generated.length,
    stories: result.generated.map((s) => ({
      id: s.id,
      title: s.title,
      medium: s.medium,
    })),
    errors: result.errors,
  });
}

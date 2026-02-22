import { NextResponse, type NextRequest } from "next/server";
import { generateCatalogStories } from "@/lib/agents/catalogGenerator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env["CATALOG_GENERATE_SECRET"];
  if (!secret) {
    // If no secret is configured, allow only from localhost
    const host = request.headers.get("host") ?? "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
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

import { NextResponse } from "next/server";
import { getFullCatalog } from "@/lib/agents/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getFullCatalog();
  return NextResponse.json({ count: catalog.length, catalog });
}

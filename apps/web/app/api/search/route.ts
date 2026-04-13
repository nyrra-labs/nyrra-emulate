import { NextRequest, NextResponse } from "next/server";
import { getSearchIndex, searchEntries } from "@/lib/search-index";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const index = await getSearchIndex();
  const results = searchEntries(q, index);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}

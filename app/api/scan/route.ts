import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const businessSlug = String(body.businessSlug || "").trim();
    if (!businessSlug) {
      return NextResponse.json({ error: "Missing businessSlug" }, { status: 400 });
    }

    const store = await readStore();
    const business = store.businesses.find((b) => b.slug === businessSlug);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    business.totalScans += 1;
    await writeStore(store);

    return NextResponse.json({ totalScans: business.totalScans });
  } catch {
    return NextResponse.json({ error: "Failed to track scan" }, { status: 500 });
  }
}


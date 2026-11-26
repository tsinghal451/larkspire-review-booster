import { NextRequest, NextResponse } from "next/server";
import { readStore, slugify, writeStore, type Business } from "@/lib/db";
import { getPresetByCategory } from "@/lib/presets";

function normalizeWhatsapp(raw: unknown): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const category = String(body.category || "Other / Custom").trim();
    const preset = getPresetByCategory(category);
    const city = String(body.city || "Jaipur").trim();
    const tagline = String(body.tagline || preset.tagline).trim();
    const accentColor = String(body.accentColor || preset.accentColor).trim();
    const googleReviewUrl = String(
      body.googleReviewUrl || "https://www.google.com/maps"
    ).trim();
    const ownerWhatsapp = normalizeWhatsapp(body.ownerWhatsapp);

    if (!name) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    const store = await readStore();
    let slug = slugify(name);
    if (!slug) slug = `business-${Date.now()}`;
    if (store.businesses.some((b) => b.slug === slug)) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const quickTags =
      Array.isArray(body.quickTags) && body.quickTags.length > 0
        ? body.quickTags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : preset.quickTags;

    const issueTags =
      Array.isArray(body.issueTags) && body.issueTags.length > 0
        ? body.issueTags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : preset.issueTags;

    const newBusiness: Business = {
      slug,
      name,
      category,
      city,
      tagline,
      accentColor,
      googleReviewUrl,
      ownerWhatsapp,
      quickTags,
      issueTags,
      totalScans: 0,
      positiveClicks: 0,
      privateFeedbackCount: 0,
    };

    store.businesses.unshift(newBusiness);
    await writeStore(store);

    return NextResponse.json({ business: newBusiness }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug")?.trim();
    if (!slug) {
      return NextResponse.json(
        { error: "Business slug is required" },
        { status: 400 }
      );
    }

    const store = await readStore();
    const exists = store.businesses.some((b) => b.slug === slug);
    if (!exists) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    store.businesses = store.businesses.filter((b) => b.slug !== slug);
    store.feedbacks = store.feedbacks.filter((f) => f.businessSlug !== slug);
    await writeStore(store);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim();
    if (!slug) {
      return NextResponse.json(
        { error: "Business slug is required" },
        { status: 400 }
      );
    }

    const store = await readStore();
    const biz = store.businesses.find((b) => b.slug === slug);
    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (typeof body.name === "string" && body.name.trim()) {
      biz.name = body.name.trim();
    }
    if (typeof body.category === "string" && body.category.trim()) {
      biz.category = body.category.trim();
    }
    if (typeof body.city === "string" && body.city.trim()) {
      biz.city = body.city.trim();
    }
    if (typeof body.tagline === "string" && body.tagline.trim()) {
      biz.tagline = body.tagline.trim();
    }
    if (typeof body.googleReviewUrl === "string" && body.googleReviewUrl.trim()) {
      biz.googleReviewUrl = body.googleReviewUrl.trim();
    }
    if (typeof body.ownerWhatsapp === "string") {
      biz.ownerWhatsapp = normalizeWhatsapp(body.ownerWhatsapp);
    }
    if (Array.isArray(body.quickTags) && body.quickTags.length > 0) {
      biz.quickTags = body.quickTags
        .map((t: unknown) => String(t).trim())
        .filter(Boolean);
    }
    if (Array.isArray(body.issueTags) && body.issueTags.length > 0) {
      biz.issueTags = body.issueTags
        .map((t: unknown) => String(t).trim())
        .filter(Boolean);
    }

    await writeStore(store);
    return NextResponse.json({ ok: true, business: biz });
  } catch {
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}


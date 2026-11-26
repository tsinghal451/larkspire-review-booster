import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, type FeedbackEntry } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const businessSlug = String(body.businessSlug || "").trim();
    const rating = Number(body.rating);
    const type =
      body.type === "google_redirect" ? "google_redirect" : "private_feedback";

    if (!businessSlug || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Valid businessSlug and rating (1-5) are required" },
        { status: 400 }
      );
    }

    const store = await readStore();
    const business = store.businesses.find((b) => b.slug === businessSlug);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (type === "google_redirect") {
      business.positiveClicks += 1;
    } else {
      business.privateFeedbackCount += 1;
    }

    const entry: FeedbackEntry = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      businessSlug,
      rating,
      type,
      selectedTags: Array.isArray(body.selectedTags)
        ? body.selectedTags.map((t: unknown) => String(t))
        : [],
      reviewText: String(body.reviewText || "").trim(),
      customerName: String(body.customerName || "Anonymous").trim() || "Anonymous",
      customerPhone: String(body.customerPhone || "").trim(),
      status: type === "google_redirect" ? "resolved" : "pending",
      createdAt: new Date().toISOString(),
    };

    store.feedbacks.unshift(entry);
    await writeStore(store);

    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || "").trim();
    const status = body.status === "resolved" ? "resolved" : "pending";

    const store = await readStore();
    const item = store.feedbacks.find((f) => f.id === id);
    if (!item) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    item.status = status;
    await writeStore(store);

    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}


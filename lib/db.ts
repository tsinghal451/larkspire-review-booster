import fs from "fs";
import path from "path";

export interface Business {
  slug: string;
  name: string;
  category: string;
  city: string;
  tagline: string;
  accentColor: string;
  googleReviewUrl: string;
  ownerWhatsapp?: string;
  quickTags: string[];
  issueTags: string[];
  totalScans: number;
  positiveClicks: number;
  privateFeedbackCount: number;
}

export interface FeedbackEntry {
  id: string;
  businessSlug: string;
  rating: number;
  type: "google_redirect" | "private_feedback";
  selectedTags: string[];
  reviewText: string;
  customerName: string;
  customerPhone: string;
  status: "pending" | "resolved";
  createdAt: string;
}

export interface StoreData {
  businesses: Business[];
  feedbacks: FeedbackEntry[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEFAULT_STORE: StoreData = {
  businesses: [
    {
      slug: "larkspire",
      name: "Larkspire",
      category: "Digital Agency",
      city: "Jaipur",
      tagline: "Next.js Websites, Shopify Stores, SEO & Performance Marketing.",
      accentColor: "#0f766e",
      googleReviewUrl: "https://g.page/r/Cde6fduAqdZREAI/review",
      ownerWhatsapp: "",
      quickTags: [
        "Fast Next.js website",
        "Great design & UX",
        "SEO & lead results",
        "Responsive team",
        "On-time delivery",
        "Clear communication",
      ],
      issueTags: [
        "Delivery timeline",
        "Communication",
        "Design revisions",
        "Pricing",
        "Support response",
      ],
      totalScans: 0,
      positiveClicks: 0,
      privateFeedbackCount: 0,
    },
    {
      slug: "anil-kumar-and-sons",
      name: "Anil Kumar & Sons (Bahanera wale)",
      category: "CCTV & Security Solutions",
      city: "Bharatpur",
      tagline: "CCTV camera installation, IP systems, IT networking & AMC.",
      accentColor: "#1d4ed8",
      googleReviewUrl:
        "https://search.google.com/local/writereview?placeid=ChIJK2eLHg2jczkRsL0uoaYnEiU",
      ownerWhatsapp: "918947976889",
      quickTags: [
        "Best CCTV quality",
        "Neat installation",
        "Helpful staff",
        "Genuine pricing",
        "Quick support",
        "On-time service",
      ],
      issueTags: [
        "Installation delay",
        "Camera/DVR issue",
        "Support response",
        "Pricing",
        "Staff behavior",
      ],
      totalScans: 0,
      positiveClicks: 0,
      privateFeedbackCount: 0,
    },
    {
      slug: "jaipur-brew-cafe",
      name: "Jaipur Brew & Bake",
      category: "Cafe & Bakery",
      city: "Jaipur",
      tagline: "Specialty coffee, wood-fired bites & warm vibes in C-Scheme.",
      accentColor: "#0f766e",
      googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Jaipur+Cafe",
      quickTags: [
        "Amazing coffee",
        "Cozy ambiance",
        "Friendly staff",
        "Fresh pastries",
        "Fast Wi-Fi",
        "Value for money",
      ],
      issueTags: [
        "Slow service",
        "Order mix-up",
        "Food temperature",
        "Cleanliness",
        "Pricing",
      ],
      totalScans: 42,
      positiveClicks: 34,
      privateFeedbackCount: 2,
    },
    {
      slug: "aura-skin-clinic",
      name: "Aura Skin & Dental Studio",
      category: "Clinic & Healthcare",
      city: "Jaipur",
      tagline: "Trusted dermatology & smile care in Vaishali Nagar.",
      accentColor: "#2563eb",
      googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Skin+Clinic+Jaipur",
      quickTags: [
        "Doctor listened patiently",
        "Hygienic clinic",
        "Painless treatment",
        "Polite reception",
        "Clear explanation",
        "On-time appointment",
      ],
      issueTags: [
        "Long waiting time",
        "Billing confusion",
        "Reception behavior",
        "Follow-up delay",
      ],
      totalScans: 29,
      positiveClicks: 24,
      privateFeedbackCount: 1,
    },
    {
      slug: "royal-heritage-jewels",
      name: "Royal Heritage Jewels",
      category: "Jewellery Showroom",
      city: "Jaipur",
      tagline: "Handcrafted Kundan, Polki & bridal collections on MI Road.",
      accentColor: "#b45309",
      googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=Jewellery+Showroom+Jaipur",
      quickTags: [
        "Stunning designs",
        "Transparent pricing",
        "Warm hospitality",
        "Authentic certification",
        "Great customisation",
      ],
      issueTags: [
        "Limited variety",
        "Waiting time",
        "Staff attention",
        "Making charges",
      ],
      totalScans: 18,
      positiveClicks: 15,
      privateFeedbackCount: 0,
    },
  ],
  feedbacks: [
    {
      id: "fb-seed-1",
      businessSlug: "jaipur-brew-cafe",
      rating: 2,
      type: "private_feedback",
      selectedTags: ["Slow service"],
      reviewText: "Coffee tasted great, but our order took almost 25 minutes during evening rush.",
      customerName: "Rohan Sharma",
      customerPhone: "+91 98290 12345",
      status: "pending",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "fb-seed-2",
      businessSlug: "aura-skin-clinic",
      rating: 3,
      type: "private_feedback",
      selectedTags: ["Long waiting time"],
      reviewText: "Doctor was very good, just had to wait 30 mins past my 5 PM slot.",
      customerName: "Neha Verma",
      customerPhone: "+91 97840 54321",
      status: "resolved",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ],
};

const STORE_KEY = "larkspire_review_store_v1";
let memoryFallback: StoreData | null = null;

function getRedisConfig(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  return null;
}

function ensureLocalStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf-8");
  }
}

export async function readStore(): Promise<StoreData> {
  const redis = getRedisConfig();
  if (redis) {
    try {
      const res = await fetch(`${redis.url}/get/${STORE_KEY}`, {
        headers: { Authorization: `Bearer ${redis.token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const payload = (await res.json()) as { result: unknown };
        if (payload.result) {
          let parsed: unknown =
            typeof payload.result === "string"
              ? JSON.parse(payload.result)
              : payload.result;
          // Handle any previously double-encoded string in Redis
          if (typeof parsed === "string") {
            parsed = JSON.parse(parsed);
          }
          const candidate = parsed as Partial<StoreData>;
          if (
            candidate &&
            Array.isArray(candidate.businesses) &&
            Array.isArray(candidate.feedbacks)
          ) {
            return candidate as StoreData;
          }
        }
        await writeStore(DEFAULT_STORE);
        return structuredClone(DEFAULT_STORE);
      }
    } catch {
      // Fall through to local/memory fallback
    }
  }

  try {
    ensureLocalStore();
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw) as StoreData;
  } catch {
    if (!memoryFallback) {
      memoryFallback = structuredClone(DEFAULT_STORE);
    }
    return memoryFallback;
  }
}

export async function writeStore(data: StoreData): Promise<void> {
  const redis = getRedisConfig();
  if (redis) {
    const res = await fetch(`${redis.url}/set/${STORE_KEY}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redis.token}`,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(data),
    });
    if (res.ok) return;
  }

  try {
    ensureLocalStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    memoryFallback = data;
  }
}

export async function getBusinessBySlug(
  slug: string
): Promise<Business | undefined> {
  const store = await readStore();
  return store.businesses.find((b) => b.slug === slug);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


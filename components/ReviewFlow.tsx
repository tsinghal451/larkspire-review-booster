"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  MessageSquareHeart,
  RefreshCw,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import type { Business } from "@/lib/db";

type Tone = "short" | "detailed" | "warm";

const RATING_LABELS: Record<number, { text: string; emoji: string }> = {
  1: { text: "Very disappointed", emoji: "😞" },
  2: { text: "Could be better", emoji: "😕" },
  3: { text: "It was okay", emoji: "😐" },
  4: { text: "Really good!", emoji: "😊" },
  5: { text: "Loved it!", emoji: "🤩" },
};

function generateSmartReview(
  business: Business,
  rating: number,
  tags: string[],
  tone: Tone,
  variant: number
): string {
  const chosen = tags.length > 0 ? tags : business.quickTags.slice(0, 2);
  const tagPhrase =
    chosen.length === 1
      ? chosen[0].toLowerCase()
      : `${chosen.slice(0, -1).join(", ").toLowerCase()} and ${chosen[chosen.length - 1].toLowerCase()}`;

  if (tone === "short") {
    const options = [
      `Had a great experience at ${business.name}! Loved the ${tagPhrase}. Definitely coming back.`,
      `${rating}/5 stars for ${business.name} — really impressed with the ${tagPhrase}. Highly recommended in ${business.city}!`,
    ];
    return options[variant % options.length];
  }

  if (tone === "warm") {
    const options = [
      `Visited ${business.name} recently and honestly had such a wonderful time. The ${tagPhrase} really stood out. Thank you to the team for making it so memorable!`,
      `One of my favorite experiences in ${business.city}! Everything at ${business.name} felt thoughtful, especially the ${tagPhrase}. Will surely recommend to friends and family.`,
    ];
    return options[variant % options.length];
  }

  const options = [
    `I visited ${business.name} (${business.category}) in ${business.city} and had a ${rating}-star experience. What stood out most was the ${tagPhrase}. Everything was smooth from start to finish — would gladly recommend them!`,
    `Really happy with my visit to ${business.name}. From the ${tagPhrase} to the overall experience, they delivered on every promise. A solid ${rating}-star spot in ${business.city}.`,
  ];
  return options[variant % options.length];
}

export default function ReviewFlow({ business }: { business: Business }) {
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);

  // 4-5 star state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tone, setTone] = useState<Tone>("short");
  const [variant, setVariant] = useState<number>(0);
  const [customReview, setCustomReview] = useState<string>("");
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [copiedAndOpened, setCopiedAndOpened] = useState<boolean>(false);

  // 1-3 star state
  const [issueTags, setIssueTags] = useState<string[]>([]);
  const [privateMessage, setPrivateMessage] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [privateSubmitted, setPrivateSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Track QR scan once on page load
  useEffect(() => {
    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessSlug: business.slug }),
    }).catch(() => { });
  }, [business.slug]);

  const generatedText = useMemo(() => {
    if (rating < 4) return "";
    return generateSmartReview(business, rating, selectedTags, tone, variant);
  }, [business, rating, selectedTags, tone, variant]);

  const displayedReview = isEdited ? customReview : generatedText;

  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(tag)) {
      setter(list.filter((t) => t !== tag));
    } else {
      setter([...list, tag]);
    }
    setIsEdited(false);
  };

  const handleCopyAndOpenGoogle = () => {
    if (navigator.clipboard && displayedReview) {
      navigator.clipboard.writeText(displayedReview).catch(() => { });
    }

    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug: business.slug,
        rating,
        type: "google_redirect",
        selectedTags,
        reviewText: displayedReview,
      }),
    }).catch(() => { });

    setCopiedAndOpened(true);
    // Open synchronously inside click handler so browser popup blockers don't block it
    window.open(business.googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  const buildWhatsappUrl = () => {
    if (!business.ownerWhatsapp) return "";
    const lines = [
      `*Private Feedback for ${business.name}*`,
      `Rating: ${rating}/5 ★`,
      issueTags.length > 0 ? `Issues: ${issueTags.join(", ")}` : "",
      privateMessage.trim() ? `Message: ${privateMessage.trim()}` : "",
      `Customer: ${customerName.trim() || "Anonymous"}${
        customerPhone.trim() ? ` (${customerPhone.trim()})` : ""
      }`,
    ].filter(Boolean);
    return `https://wa.me/${business.ownerWhatsapp}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
  };

  const handlePrivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!privateMessage.trim() && issueTags.length === 0) {
      setErrorMsg("Please select an issue or write a short note so we can help.");
      return;
    }

    const waUrl = buildWhatsappUrl();
    if (waUrl) {
      // Open synchronously inside submit gesture so browser doesn't block WhatsApp tab
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          rating,
          type: "private_feedback",
          selectedTags: issueTags,
          reviewText: privateMessage.trim() || `Selected issues: ${issueTags.join(", ")}`,
          customerName,
          customerPhone,
        }),
      });

      if (!res.ok) {
        throw new Error("Could not submit feedback");
      }
      setPrivateSubmitted(true);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = business.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const activeStar = hovered || rating;

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-8 bg-gradient-to-b from-slate-100 via-white to-slate-100">
      <div className="w-full max-w-md my-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden">
          {/* Top Brand Strip */}
          <div
            className="px-6 pt-7 pb-6 text-white text-center"
            style={{ backgroundColor: business.accentColor }}
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl font-bold tracking-wide">
              {initials}
            </div>
            <p className="text-xs uppercase tracking-widest text-white/80 font-medium">
              {business.category} • {business.city}
            </p>
            <h1 className="text-2xl font-bold mt-1">{business.name}</h1>
            <p className="text-sm text-white/90 mt-1">{business.tagline}</p>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Step 1: Star Rating */}
            {!privateSubmitted && (
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  How was your experience today?
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= activeStar;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star);
                          setCopiedAndOpened(false);
                          setErrorMsg("");
                        }}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1.5 rounded-xl transition-transform active:scale-90 hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${filled
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="h-6 mt-2">
                  {activeStar > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <span>{RATING_LABELS[activeStar].emoji}</span>
                      <span>{RATING_LABELS[activeStar].text}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Step 2A: 4 or 5 Stars -> AI Quick Review Helper + Google Redirect */}
            {rating >= 4 && (
              <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-700">
                    <Sparkles className="w-4 h-4" />
                    <span>Quick AI Review Helper</span>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                    {(["short", "warm", "detailed"] as Tone[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTone(t);
                          setIsEdited(false);
                        }}
                        className={`px-2 py-1 rounded-md capitalize font-medium transition ${tone === t
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">
                    Tap what you liked (optional):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {business.quickTags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            toggleTag(tag, selectedTags, setSelectedTags)
                          }
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${active
                              ? "bg-teal-700 text-white border-teal-700"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          {active ? "✓ " : "+ "}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-600">
                      Ready-to-post review (feel free to edit):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setVariant((v) => v + 1);
                        setIsEdited(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={displayedReview}
                    onChange={(e) => {
                      setCustomReview(e.target.value);
                      setIsEdited(true);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopyAndOpenGoogle}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  style={{ backgroundColor: business.accentColor }}
                >
                  {copiedAndOpened ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Copied! Paste on Google Maps</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Review & Open Google</span>
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </>
                  )}
                </button>

                {copiedAndOpened && (
                  <div className="text-xs text-center text-teal-700 bg-teal-50 border border-teal-100 rounded-lg py-2.5 px-3 space-y-1">
                    <p>
                      Your review is copied! Just long-press and{" "}
                      <strong>Paste</strong> on Google Maps.
                    </p>
                    <a
                      href={business.googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold underline text-teal-800"
                    >
                      <span>Didn&apos;t open? Tap here to open Google Reviews</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Step 2B: 1, 2, or 3 Stars -> Private Feedback Form */}
            {rating > 0 && rating <= 3 && !privateSubmitted && (
              <form
                onSubmit={handlePrivateSubmit}
                className="mt-5 pt-5 border-t border-slate-100 space-y-4"
              >
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex gap-3 items-start">
                  <MessageSquareHeart className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-950">
                      We&apos;re sorry it wasn&apos;t 5 stars
                    </p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Tell the owner directly so we can fix this for you right away.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-2">
                    What went wrong?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {business.issueTags.map((tag) => {
                      const active = issueTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag, issueTags, setIssueTags)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${active
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={privateMessage}
                    onChange={(e) => setPrivateMessage(e.target.value)}
                    placeholder="Share what happened so we can make it right..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone / WhatsApp"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting ? "Sending..." : "Send Private Feedback to Owner"}
                  </span>
                </button>

                <div className="text-center pt-1">
                  <a
                    href={business.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                  >
                    Or leave a public review on Google
                  </a>
                </div>
              </form>
            )}

            {/* Private Feedback Submitted Confirmation */}
            {privateSubmitted && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Thank you for telling us
                </h2>
                <p className="text-sm text-slate-600">
                  Your message has been sent directly to the{" "}
                  <strong>{business.name}</strong> management team. We&apos;ll
                  look into it right away.
                </p>
                {business.ownerWhatsapp && (
                  <a
                    href={buildWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Open WhatsApp to Send</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Viral Inbound Marketing Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-white/80 backdrop-blur px-3.5 py-2 rounded-full border border-slate-200 shadow-sm transition"
          >
            <span>Powered by</span>
            <strong className="text-teal-700 font-semibold">Larkspire</strong>
            <span className="text-slate-400">•</span>
            <span className="underline decoration-slate-300">
              Get this QR for your business
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}


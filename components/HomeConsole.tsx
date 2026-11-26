"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  MessageSquareWarning,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import type { Business, FeedbackEntry, StoreData } from "@/lib/db";
import { CATEGORY_PRESETS, getPresetByCategory } from "@/lib/presets";

export default function HomeConsole({ initialData }: { initialData: StoreData }) {
  const [data, setData] = useState<StoreData>(initialData);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialData.businesses[0]?.slug || ""
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Business Form
  const initialPreset = CATEGORY_PRESETS[0];
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(initialPreset.label);
  const [newCity, setNewCity] = useState("Jaipur");
  const [newGoogleUrl, setNewGoogleUrl] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newTagline, setNewTagline] = useState(initialPreset.tagline);
  const [newQuickTagsText, setNewQuickTagsText] = useState(
    initialPreset.quickTags.join(", ")
  );
  const [creating, setCreating] = useState(false);

  // Edit Existing Business Form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTagline, setEditTagline] = useState("");
  const [editGoogleUrl, setEditGoogleUrl] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editQuickTagsText, setEditQuickTagsText] = useState("");
  const [editIssueTagsText, setEditIssueTagsText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const selectedBusiness: Business | undefined = data.businesses.find(
    (b) => b.slug === selectedSlug
  );

  const businessFeedbacks: FeedbackEntry[] = data.feedbacks.filter(
    (f) => f.businessSlug === selectedSlug
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!selectedSlug || !origin) return;
    const url = `${origin}/r/${selectedSlug}`;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [selectedSlug, origin]);

  const refreshData = async () => {
    const res = await fetch("/api/businesses", { cache: "no-store" });
    if (res.ok) {
      const fresh = (await res.json()) as StoreData;
      setData(fresh);
    }
  };

  const handleCategoryChange = (category: string) => {
    setNewCategory(category);
    const preset = getPresetByCategory(category);
    setNewTagline(preset.tagline);
    setNewQuickTagsText(preset.quickTags.join(", "));
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const quickTags = newQuickTagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          city: newCity,
          tagline: newTagline,
          quickTags,
          ownerWhatsapp: newWhatsapp,
          googleReviewUrl:
            newGoogleUrl.trim() ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${newName} ${newCity}`
            )}`,
        }),
      });
      if (res.ok) {
        const { business } = (await res.json()) as { business: Business };
        await refreshData();
        setSelectedSlug(business.slug);
        setNewName("");
        setNewGoogleUrl("");
        setNewWhatsapp("");
        setShowAddForm(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const openEditForm = (biz: Business) => {
    setEditTagline(biz.tagline);
    setEditGoogleUrl(biz.googleReviewUrl);
    setEditWhatsapp(biz.ownerWhatsapp || "");
    setEditQuickTagsText(biz.quickTags.join(", "));
    setEditIssueTagsText(biz.issueTags.join(", "));
    setShowEditForm(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedBusiness.slug,
          tagline: editTagline,
          googleReviewUrl: editGoogleUrl,
          ownerWhatsapp: editWhatsapp,
          quickTags: editQuickTagsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          issueTags: editIssueTagsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        await refreshData();
        setShowEditForm(false);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleFeedbackStatus = async (item: FeedbackEntry) => {
    const nextStatus = item.status === "resolved" ? "pending" : "resolved";
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: nextStatus }),
    });
    if (res.ok) {
      await refreshData();
    }
  };

  const handleDeleteBusiness = async (biz: Business) => {
    const confirmed = window.confirm(
      `Delete "${biz.name}" and its feedback history?`
    );
    if (!confirmed) return;

    const res = await fetch(
      `/api/businesses?slug=${encodeURIComponent(biz.slug)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      const freshRes = await fetch("/api/businesses", { cache: "no-store" });
      if (freshRes.ok) {
        const fresh = (await freshRes.json()) as StoreData;
        setData(fresh);
        setSelectedSlug(fresh.businesses[0]?.slug || "");
      }
    }
  };

  const reviewUrl = origin ? `${origin}/r/${selectedSlug}` : `/r/${selectedSlug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Larkspire Review Booster
              </h1>
              <p className="text-xs text-slate-500">
                Smart QR • 4–5★ AI Review Helper • 1–3★ Private Feedback
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Business</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Add New Business Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateBusiness}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Create New Business QR Page
              </h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Business Name (e.g. Pink City Salon)"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-700 focus:outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-teal-700 focus:outline-none"
              >
                {CATEGORY_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.label}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="City (e.g. Jaipur)"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-700 focus:outline-none"
              />
              <input
                type="url"
                value={newGoogleUrl}
                onChange={(e) => setNewGoogleUrl(e.target.value)}
                placeholder="Google Review URL (g.page/...)"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-teal-700 focus:outline-none"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Owner WhatsApp (for 1–3★ alerts)
                </label>
                <input
                  type="tel"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  placeholder="e.g. 9829012345"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Tagline (shown on QR page)
                </label>
                <input
                  type="text"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  4–5★ AI Review Tags (auto-filled by category, comma-separated)
                </label>
                <input
                  type="text"
                  value={newQuickTagsText}
                  onChange={(e) => setNewQuickTagsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Generate QR & Review Page"}
            </button>
          </form>
        )}

        {/* Business Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {data.businesses.map((biz) => {
            const active = biz.slug === selectedSlug;
            return (
              <button
                key={biz.slug}
                type="button"
                onClick={() => setSelectedSlug(biz.slug)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                  active
                    ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {biz.name}
              </button>
            );
          })}
        </div>

        {selectedBusiness && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: QR Standee Preview & Test Link */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Live Customer QR Standee
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-3">
                {selectedBusiness.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedBusiness.category} • {selectedBusiness.city}
              </p>

              <div className="my-5 p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${selectedBusiness.name}`}
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 bg-slate-100 rounded-xl animate-pulse" />
                )}
                <p className="text-[11px] font-medium text-slate-500 mt-2">
                  Powered by <strong className="text-teal-700">Larkspire</strong>
                </p>
              </div>

              <div className="w-full space-y-2.5">
                <Link
                  href={`/r/${selectedBusiness.slug}`}
                  target="_blank"
                  className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Open Customer Review Page</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>

                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`${selectedBusiness.slug}-qr.png`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download QR PNG</span>
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => openEditForm(selectedBusiness)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit Tags & URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBusiness(selectedBusiness)}
                    className="w-full py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>

                {showEditForm && (
                  <form
                    onSubmit={handleSaveEdit}
                    className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Customize {selectedBusiness.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEditForm(false)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Close
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Google Review URL
                      </label>
                      <input
                        type="url"
                        value={editGoogleUrl}
                        onChange={(e) => setEditGoogleUrl(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Owner WhatsApp Number (1–3★ feedback goes here)
                      </label>
                      <input
                        type="tel"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        placeholder="e.g. 9829012345 or 919829012345"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={editTagline}
                        onChange={(e) => setEditTagline(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        4–5★ Review Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editQuickTagsText}
                        onChange={(e) => setEditQuickTagsText(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        1–3★ Issue Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editIssueTagsText}
                        onChange={(e) => setEditIssueTagsText(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-teal-700 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="w-full py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 disabled:opacity-60"
                    >
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                )}

                <p className="text-[11px] text-slate-400 break-all pt-1">
                  {reviewUrl}
                </p>
              </div>
            </div>

            {/* Right: Stats + Private Feedback Inbox */}
            <div className="lg:col-span-7 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <ScanLine className="w-4 h-4 text-slate-400" />
                    <span>Total Scans</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-1.5">
                    {selectedBusiness.totalScans}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-teal-700 text-xs font-medium">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>4–5★ Google Clicks</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-1.5">
                    {selectedBusiness.positiveClicks}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
                    <MessageSquareWarning className="w-4 h-4" />
                    <span>Private Intercepts</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-1.5">
                    {selectedBusiness.privateFeedbackCount}
                  </p>
                </div>
              </div>

              {/* Recent Activity / Private Feedbacks */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Recent Activity & Private Feedback
                  </h3>
                  <button
                    type="button"
                    onClick={refreshData}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {businessFeedbacks.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No activity yet. Open the Customer Review Page and test a 1–3★ or
                    4–5★ rating!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {businessFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                fb.rating >= 4
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {fb.rating} ★
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {fb.type === "google_redirect"
                                ? "Copied & Opened Google"
                                : `Private Feedback • ${fb.customerName}`}
                            </span>
                            {fb.customerPhone && (
                              <span className="text-xs text-slate-500">
                                ({fb.customerPhone})
                              </span>
                            )}
                          </div>

                          {fb.type === "private_feedback" && (
                            <button
                              type="button"
                              onClick={() => toggleFeedbackStatus(fb)}
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                                fb.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {fb.status === "resolved" ? "Resolved" : "Mark Resolved"}
                              </span>
                            </button>
                          )}
                        </div>

                        {fb.reviewText && (
                          <p className="text-sm text-slate-700">{fb.reviewText}</p>
                        )}

                        {fb.selectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {fb.selectedTags.map((t) => (
                              <span
                                key={t}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


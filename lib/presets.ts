export interface CategoryPreset {
  label: string;
  accentColor: string;
  tagline: string;
  quickTags: string[];
  issueTags: string[];
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    label: "Cafe & Restaurant",
    accentColor: "#0f766e",
    tagline: "Freshly brewed coffee, delicious food & warm hospitality.",
    quickTags: [
      "Delicious food",
      "Amazing coffee",
      "Cozy ambiance",
      "Friendly staff",
      "Fast service",
      "Value for money",
    ],
    issueTags: [
      "Slow service",
      "Order mix-up",
      "Food temperature",
      "Cleanliness",
      "Pricing",
    ],
  },
  {
    label: "Salon & Spa",
    accentColor: "#be185d",
    tagline: "Expert styling, relaxing care & premium beauty treatments.",
    quickTags: [
      "Great haircut & styling",
      "Hygienic & clean",
      "Polite stylists",
      "Relaxing ambiance",
      "Worth every rupee",
      "On-time appointment",
    ],
    issueTags: [
      "Waiting time",
      "Styling not as expected",
      "Staff behavior",
      "Pricing",
      "Cleanliness",
    ],
  },
  {
    label: "Clinic & Healthcare",
    accentColor: "#2563eb",
    tagline: "Compassionate care, modern treatment & trusted doctors.",
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
  },
  {
    label: "Jewellery Showroom",
    accentColor: "#b45309",
    tagline: "Handcrafted designs, certified purity & trusted craftsmanship.",
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
  },
  {
    label: "Digital Agency",
    accentColor: "#0f766e",
    tagline: "High-converting websites, SEO & performance marketing.",
    quickTags: [
      "Fast website delivery",
      "Great design & UX",
      "SEO & lead results",
      "Responsive team",
      "Clear communication",
      "Value for money",
    ],
    issueTags: [
      "Delivery timeline",
      "Communication",
      "Design revisions",
      "Pricing",
      "Support response",
    ],
  },
  {
    label: "Gym & Fitness",
    accentColor: "#dc2626",
    tagline: "Modern equipment, certified trainers & motivating energy.",
    quickTags: [
      "Supportive trainers",
      "Well-maintained equipment",
      "Clean & hygienic",
      "Great workout vibe",
      "Good membership value",
    ],
    issueTags: [
      "Crowded hours",
      "Equipment maintenance",
      "Trainer attention",
      "Cleanliness",
    ],
  },
  {
    label: "Hotel & Stay",
    accentColor: "#4f46e5",
    tagline: "Comfortable rooms, great location & memorable hospitality.",
    quickTags: [
      "Clean & spacious rooms",
      "Helpful staff",
      "Smooth check-in",
      "Great breakfast",
      "Prime location",
    ],
    issueTags: [
      "Room cleanliness",
      "Check-in delay",
      "Noise issue",
      "Wi-Fi / AC issue",
    ],
  },
  {
    label: "Other / Custom",
    accentColor: "#0f766e",
    tagline: "We value your honest feedback and strive to serve you better.",
    quickTags: [
      "Great service",
      "Friendly staff",
      "Clean & welcoming",
      "Value for money",
      "Quick response",
    ],
    issueTags: [
      "Waiting time",
      "Staff behavior",
      "Service quality",
      "Pricing",
    ],
  },
];

export function getPresetByCategory(category: string): CategoryPreset {
  return (
    CATEGORY_PRESETS.find(
      (p) => p.label.toLowerCase() === category.toLowerCase()
    ) || CATEGORY_PRESETS[CATEGORY_PRESETS.length - 1]
  );
}


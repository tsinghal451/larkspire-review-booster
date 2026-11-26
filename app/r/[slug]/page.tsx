import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/db";
import ReviewFlow from "@/components/ReviewFlow";

export const dynamic = "force-dynamic";

export default async function BusinessReviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const business = await getBusinessBySlug(params.slug);
  if (!business) {
    notFound();
  }

  return <ReviewFlow business={business} />;
}


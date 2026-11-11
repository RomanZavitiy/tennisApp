import { notFound } from "next/navigation";

import { isFeatureEnabled, type FeatureName } from "@/lib/features";

/** First line of a hidden section's page (and its generateMetadata): a 404,
 * never a redirect, the same for a guest and a signed-in player. */
export function requireFeature(feature: FeatureName): void {
  if (!isFeatureEnabled(feature)) {
    notFound();
  }
}

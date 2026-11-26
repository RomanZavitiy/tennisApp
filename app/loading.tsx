import { PageSkeleton } from "@/components/page-skeleton";

// One boundary at the root covers every page: navigating shows the
// skeleton at once instead of the old page staying frozen until the new
// one's database reads finish.
export default function Loading() {
  return <PageSkeleton />;
}

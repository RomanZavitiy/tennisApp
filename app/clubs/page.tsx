import { redirect } from "next/navigation";

// The court search moved to the home page (slice K4). Kept as a redirect so
// old links and bookmarks to /clubs still land on it; /clubs/[id] stays.
export default function ClubsPage() {
  redirect("/");
}

import { Button } from "@/components/ui/button";

// Placeholder until the real home page. The button proves shadcn/ui and the
// theme tokens in globals.css are wired up.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        MatchFinder Kraków
      </h1>
      <p className="max-w-md text-muted-foreground">
        Find a sparring partner and a court in Kraków.
      </p>
      <Button size="lg">Coming soon</Button>
    </main>
  );
}

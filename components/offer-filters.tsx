import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { feedHref, type FeedFilters } from "@/lib/offers/feed-filters";
import { DISTRICT_LABELS, NTRP_LEVELS } from "@/lib/profile/options";

// The feed's filters (task 3.7): a plain GET form, so the browser puts them
// in the URL itself and no client JavaScript is needed. Submitting drops
// ?page, so new filters start from the first page.
export function OfferFilters({ filters }: { filters: FeedFilters }) {
  const active = Object.keys(filters).length > 0;

  return (
    <form
      method="get"
      action="/offers"
      // Remount on every new set of filters: the fields are uncontrolled,
      // and "Clear" must empty them, not keep what was typed.
      key={feedHref(filters)}
      aria-label="Filter offers"
      className="mt-6 grid grid-cols-2 items-end gap-3 sm:grid-cols-5"
    >
      <div className="space-y-1">
        <Label htmlFor="filter-date">Date</Label>
        <Input
          id="filter-date"
          name="date"
          type="date"
          defaultValue={filters.date}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-district">District</Label>
        <NativeSelect
          id="filter-district"
          name="district"
          className="w-full"
          defaultValue={filters.district ?? ""}
        >
          <NativeSelectOption value="">Any</NativeSelectOption>
          {Object.entries(DISTRICT_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-ntrp">My level (NTRP)</Label>
        <NativeSelect
          id="filter-ntrp"
          name="ntrp"
          className="w-full"
          defaultValue={filters.ntrp?.toFixed(1) ?? ""}
        >
          <NativeSelectOption value="">Any</NativeSelectOption>
          {NTRP_LEVELS.map((level) => (
            <NativeSelectOption key={level} value={level.toFixed(1)}>
              {level.toFixed(1)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-format">Format</Label>
        <NativeSelect
          id="filter-format"
          name="format"
          className="w-full"
          defaultValue={filters.format ?? ""}
        >
          <NativeSelectOption value="">Any</NativeSelectOption>
          <NativeSelectOption value="SINGLES">Singles</NativeSelectOption>
          <NativeSelectOption value="DOUBLES">Doubles</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="flex items-center gap-2 pb-2">
        <input
          id="filter-courtBooked"
          name="courtBooked"
          type="checkbox"
          value="1"
          defaultChecked={filters.courtBooked ?? false}
        />
        <Label htmlFor="filter-courtBooked">Court already booked</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Filter</Button>
        {active && (
          <Link href="/offers" className={buttonVariants({ variant: "ghost" })}>
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}

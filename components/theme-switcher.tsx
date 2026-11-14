"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
] as const;

const subscribe = () => () => undefined;

// Light / Dark, nothing else: a third "System" option only confused people.
// Until the player picks one, the site still follows the device setting
// (ThemeProvider), and the button for whatever that resolved to is shown as
// pressed. The choice lives in localStorage (next-themes), so the server
// can't know it: until the page has hydrated no option is marked as
// pressed, rather than marking the wrong one.
export function ThemeSwitcher({ className }: { className?: string }) {
  const t = useTranslations("ThemeSwitcher");
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border bg-card p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const active = hydrated && resolvedTheme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={t(value)}
            title={t(value)}
            onClick={() => {
              setTheme(value);
            }}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

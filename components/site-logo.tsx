import Image from "next/image";

import { cn } from "@/lib/utils";

// The logo in both themes (dark mode): the wordmark is part of the image, so
// each theme has its own file — dark lettering for light pages, light
// lettering for dark ones. Both are rendered and CSS shows one; the hidden
// one is out of the accessibility tree, so `alt` is announced once.
export function SiteLogo({
  alt,
  className,
  priority = false,
}: {
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src="/brand/spinbuddy-logo.webp"
        alt={alt}
        width={1661}
        height={445}
        priority={priority}
        className={cn("w-auto dark:hidden", className)}
      />
      <Image
        src="/brand/spinbuddy-logo-dark.webp"
        alt={alt}
        width={900}
        height={242}
        priority={priority}
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}

import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/notifications/app-url";
import { isProductionDeployment, robotsRules } from "@/lib/seo/site-map";

export default function robots(): MetadataRoute.Robots {
  return robotsRules(appUrl(), isProductionDeployment());
}

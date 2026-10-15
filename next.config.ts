import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Otherwise `next dev` appends its own agent-rules block to our AGENTS.md
  // whenever an AI agent runs it — AGENTS.md is owned by us (see decisions.md).
  agentRules: false,
};

export default withNextIntl(nextConfig);

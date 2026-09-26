import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otherwise `next dev` appends its own agent-rules block to our AGENTS.md
  // whenever an AI agent runs it — AGENTS.md is owned by us (see decisions.md).
  agentRules: false,
};

export default nextConfig;

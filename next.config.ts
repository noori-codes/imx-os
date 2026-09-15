import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this repo — a stray lockfile in /home/ims
  // otherwise makes compile hang while it walks the parent tree.
  turbopack: {
    root: projectRoot,
  },
  // Don’t auto-write AGENTS.md / CLAUDE.md on every boot.
  agentRules: false,
  // Tree-shake heavy icon/chart barrels for smaller client bundles.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;

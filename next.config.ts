import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Cursor SDK is a Node library (spawns a local executor); keep it out of
  // the bundler so its runtime assets resolve normally at request time.
  serverExternalPackages: ["@cursor/sdk"],
};

export default nextConfig;

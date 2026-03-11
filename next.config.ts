import type { NextConfig } from "next";

const repo = "kpop-producer-sim";
const isProd = process.env.NODE_ENV === "production";

const basePath = isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: isProd ? `/${repo}/` : "",
  images: { unoptimized: true },
};

export default nextConfig;

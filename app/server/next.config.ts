import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  // 确保使用src目录
  pageExtensions: ["ts", "tsx", "js", "jsx"],
};

export default nextConfig;

import type { NextConfig } from "next";

const staticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: staticDemo ? "export" : undefined,
  basePath: staticDemo && basePath ? basePath : undefined,
  assetPrefix: staticDemo && basePath ? basePath : undefined,
  trailingSlash: staticDemo,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

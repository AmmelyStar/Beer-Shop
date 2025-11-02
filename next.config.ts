import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopify CDN (твой магазин)
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.cdn.shopify.com",
      },
      // то, что у тебя уже было - оставляем
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "tailwindcss.com",
      },
    ],
  },
  // experimental: {
  //   reactCompiler: true,
  // },
};

export default nextConfig;

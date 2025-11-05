import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopify CDN
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.cdn.shopify.com",
      },
      // Дополнительные источники
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "tailwindcss.com",
      },
    ],

    // 🧠 Включаем это для dev, чтобы не залипал кеш картинок
    unoptimized: process.env.NODE_ENV !== "production",
  minimumCacheTTL: 0,
  },
};

export default nextConfig;

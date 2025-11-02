import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "tailwindcss.com" },
    ],
    // or simpler:
    // domains: ["images.unsplash.com", "tailwindcss.com"],
  },
  // experimental: {
  //   reactCompiler: true, // if you actually want the React Compiler
  // },
};

export default nextConfig;

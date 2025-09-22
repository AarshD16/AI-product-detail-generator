import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",       // anything hitting /api/*
        destination: "http://localhost:4000/:path*", // proxy to backend
      },
    ];
  },
};

export default nextConfig;

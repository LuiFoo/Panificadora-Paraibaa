import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'img.freepik.com',
      'media.discordapp.net', // <- adiciona este aqui
    ],
  },
};

export default nextConfig;
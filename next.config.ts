import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'img.freepik.com',
      'media.discordapp.net', // <- adiciona este aqui
      'cdn.discordapp.com',
    ],
  },
};

export default nextConfig;
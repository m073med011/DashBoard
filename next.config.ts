import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname: "lemonchiffon-octopus-104052.hostingersite.com",
      },
      // https://darkgrey-chough-759221.hostingersite.com/api/v1/dashboard/
      {
        hostname: "darkgrey-chough-759221.hostingersite.com",
      },
      // "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiqrkHU7rL47iHmsuHIWt62VRqLNQi2vSMof35TytFW55JHO1L3afgc3nVfkXrKbR0UKA&usqp=CAU"
      {
        hostname: "encrypted-tbn0.gstatic.com",
      },
      // "https://fantasticegypt.com/images/mapofcairoegypt.jpg",
      {
        hostname: "fantasticegypt.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
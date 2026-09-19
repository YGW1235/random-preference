import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://random.preference.com";

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/history`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

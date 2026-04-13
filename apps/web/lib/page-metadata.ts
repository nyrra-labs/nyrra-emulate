import type { Metadata } from "next";
import { PAGE_TITLES } from "./page-titles";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_LOCALE,
  OG_TYPE,
  PAGE_SITE_DESCRIPTION,
  ROOT_OG_IMAGE_URL,
  SITE_NAME,
  TWITTER_CARD,
  ogImageAlt,
  suffixWithSiteName,
} from "./site-metadata";

export function pageMetadata(slug: string): Metadata {
  const title = PAGE_TITLES[slug];
  if (!title) return {};

  const displayTitle = title.replace(/\n/g, " ");
  const fullTitle = suffixWithSiteName(displayTitle);
  const ogImageUrl = slug ? `/og/${slug}` : ROOT_OG_IMAGE_URL;

  return {
    title: displayTitle,
    description: PAGE_SITE_DESCRIPTION,
    openGraph: {
      type: OG_TYPE,
      locale: OG_LOCALE,
      siteName: SITE_NAME,
      title: fullTitle,
      description: PAGE_SITE_DESCRIPTION,
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: ogImageAlt(displayTitle),
        },
      ],
    },
    twitter: {
      card: TWITTER_CARD,
      title: fullTitle,
      description: PAGE_SITE_DESCRIPTION,
      images: [ogImageUrl],
    },
  };
}

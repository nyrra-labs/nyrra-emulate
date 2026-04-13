export type NavSection = {
  title?: string;
  items: { href: string; label: string }[];
};

// Only routes that are actually implemented in src/routes. Do NOT add entries
// here until the corresponding +page.svelte exists, otherwise the sidebar and
// mobile drawer will link into 404s. The Next.js app at apps/web remains the
// authoritative full docs tree during the side-by-side migration.
export const sections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Getting Started" },
      { href: "/programmatic-api", label: "Programmatic API" },
      { href: "/configuration", label: "Configuration" },
      { href: "/nextjs", label: "Next.js Integration" },
    ],
  },
  {
    title: "Services",
    items: [
      { href: "/foundry", label: "Foundry" },
      { href: "/vercel", label: "Vercel" },
      { href: "/github", label: "GitHub" },
      { href: "/google", label: "Google" },
      { href: "/slack", label: "Slack" },
      { href: "/apple", label: "Apple" },
      { href: "/microsoft", label: "Microsoft Entra ID" },
      { href: "/aws", label: "AWS" },
      { href: "/okta", label: "Okta" },
      { href: "/mongoatlas", label: "MongoDB Atlas" },
      { href: "/resend", label: "Resend" },
      { href: "/stripe", label: "Stripe" },
    ],
  },
  {
    title: "Reference",
    items: [
      { href: "/authentication", label: "Authentication" },
      { href: "/architecture", label: "Architecture" },
    ],
  },
];

export const allItems = sections.flatMap((s) => s.items);

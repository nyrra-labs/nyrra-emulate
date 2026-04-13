const DEFAULT_SERVICE_NAME_LIST = [
  "vercel",
  "github",
  "google",
  "slack",
  "apple",
  "microsoft",
  "okta",
  "aws",
  "resend",
  "stripe",
  "mongoatlas",
  "clerk",
] as const;

const EXTRA_SERVICE_NAME_LIST = ["foundry"] as const;

const SERVICE_NAME_LIST = [...DEFAULT_SERVICE_NAME_LIST, ...EXTRA_SERVICE_NAME_LIST] as const;

export type ServiceName = (typeof SERVICE_NAME_LIST)[number];
export const SERVICE_NAMES: readonly ServiceName[] = SERVICE_NAME_LIST;
export const DEFAULT_SERVICE_NAMES: readonly ServiceName[] = DEFAULT_SERVICE_NAME_LIST;

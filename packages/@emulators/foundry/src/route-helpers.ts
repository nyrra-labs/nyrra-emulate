import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "@emulators/core";

export function foundryOauthError(
  c: Context<AppEnv>,
  status: number,
  error: string,
  errorDescription: string,
): Response {
  return c.json(
    {
      error,
      error_description: errorDescription,
    },
    status as ContentfulStatusCode,
  );
}

export function foundryPermissionDenied(c: Context<AppEnv>, errorName: string, errorDescription: string): Response {
  return c.json(
    {
      errorCode: "PERMISSION_DENIED",
      errorName,
      errorDescription,
    },
    403,
  );
}

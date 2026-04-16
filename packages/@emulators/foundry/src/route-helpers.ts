import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "@emulators/core";
import { foundryErrorInstanceId } from "./helpers.js";

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

export function foundryPermissionDenied(
  c: Context<AppEnv>,
  errorName: string,
  errorDescription: string,
  parameters: Record<string, unknown> = {},
): Response {
  return c.json(
    {
      errorCode: "PERMISSION_DENIED",
      errorName,
      errorDescription,
      errorInstanceId: foundryErrorInstanceId(),
      parameters,
    },
    403,
  );
}

export function foundryNotFound(
  c: Context<AppEnv>,
  errorName: string,
  errorDescription: string,
  parameters: Record<string, unknown> = {},
): Response {
  return c.json(
    {
      errorCode: "NOT_FOUND",
      errorName,
      errorDescription,
      errorInstanceId: foundryErrorInstanceId(),
      parameters,
    },
    404,
  );
}

export function foundryInvalidRequest(
  c: Context<AppEnv>,
  errorName: string,
  errorDescription: string,
  parameters: Record<string, unknown> = {},
): Response {
  return c.json(
    {
      errorCode: "INVALID_ARGUMENT",
      errorName,
      errorDescription,
      errorInstanceId: foundryErrorInstanceId(),
      parameters,
    },
    400,
  );
}

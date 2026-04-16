import type { FoundryUser } from "../entities.js";
import { requireAuth, type RouteContext } from "@emulators/core";
import { getFoundryStore } from "../store.js";
import { currentUserResponse, foundryErrorInstanceId, hasScope } from "../helpers.js";
import { foundryPermissionDenied } from "../route-helpers.js";

export function adminRoutes({ app, store }: RouteContext): void {
  const fs = getFoundryStore(store);

  app.get("/api/v2/admin/users/getCurrent", requireAuth(), (c) => {
    const authUser = c.get("authUser");
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:admin-read")) {
      return foundryPermissionDenied(c, "GetCurrentUserPermissionDenied", "Could not getCurrent the User.");
    }

    const user = fs.users.findOneBy("username", authUser.login as FoundryUser["username"]);
    if (!user || !user.active) {
      return c.json(
        {
          error: "invalid_token",
          error_description: "The access token is invalid.",
        },
        401,
      );
    }

    return c.json(currentUserResponse(user));
  });

  app.get("/api/v2/admin/enrollments/getCurrent", requireAuth(), (c) => {
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:admin-read")) {
      return foundryPermissionDenied(c, "GetCurrentEnrollmentPermissionDenied", "Could not getCurrent the Enrollment.");
    }

    const enrollment = fs.enrollments.all()[0];
    if (!enrollment) {
      return c.json(
        {
          errorCode: "NOT_FOUND",
          errorName: "EnrollmentNotFound",
          errorDescription: "The given Enrollment could not be found.",
          errorInstanceId: foundryErrorInstanceId(),
          parameters: { enrollmentRid: null },
        },
        404,
      );
    }

    return c.json({
      rid: enrollment.enrollment_rid,
      name: enrollment.name,
      createdTime: enrollment.created_time ?? undefined,
    });
  });

  // CLI compat: GetCurrentUser calls /multipass/api/me before v2 endpoints.
  app.get("/multipass/api/me", requireAuth(), (c) => {
    const authUser = c.get("authUser")!;

    const user = fs.users.findOneBy("username", authUser.login as FoundryUser["username"]);
    if (!user || !user.active) {
      return c.json(
        {
          error: "invalid_token",
          error_description: "The access token is invalid.",
        },
        401,
      );
    }

    return c.json({
      id: user.user_id,
      username: user.username,
      displayName: user.display_name,
    });
  });
}

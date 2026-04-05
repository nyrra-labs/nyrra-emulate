import type { FoundryUser } from "../entities.js";
import { requireAuth, type RouteContext } from "@emulators/core";
import { getFoundryStore } from "../store.js";
import { currentUserResponse, hasScope } from "../helpers.js";
import { foundryPermissionDenied } from "../route-helpers.js";

export function adminRoutes({ app, store }: RouteContext): void {
  const fs = getFoundryStore(store);

  app.get("/api/v2/admin/users/getCurrent", requireAuth(), (c) => {
    const authUser = c.get("authUser");
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:admin-read")) {
      return foundryPermissionDenied(c, "Get Current User Permission Denied", "Could not get the current user.");
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
}

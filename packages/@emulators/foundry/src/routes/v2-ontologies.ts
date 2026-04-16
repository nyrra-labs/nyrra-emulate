import { requireAuth, type RouteContext } from "@emulators/core";
import { getFoundryStore } from "../store.js";
import { foundryPaginate, hasScope } from "../helpers.js";
import { foundryNotFound, foundryPermissionDenied } from "../route-helpers.js";

export function v2OntologyRoutes({ app, store }: RouteContext): void {
  const fs = getFoundryStore(store);

  app.get("/api/v2/ontologies", requireAuth(), (c) => {
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:ontologies-read")) {
      return foundryPermissionDenied(c, "ListOntologiesPermissionDenied", "Could not list ontologies.");
    }

    const pageSize = parseInt(c.req.query("pageSize") ?? "100", 10);
    const pageToken = c.req.query("pageToken") || null;

    const all = fs.ontologies.all();
    const page = foundryPaginate(
      all.map((o) => ({
        rid: o.rid,
        apiName: o.api_name,
        displayName: o.display_name,
        description: o.description ?? "",
      })),
      pageSize,
      pageToken,
    );

    return c.json({ data: page.data });
  });

  app.post("/api/v2/ontologies/:ontology/queries/:queryApiName/execute", requireAuth(), async (c) => {
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:ontologies-read")) {
      return foundryPermissionDenied(c, "ExecuteQueryPermissionDenied", "Could not execute the query.");
    }

    const ontologyId = c.req.param("ontology") ?? "";
    const queryApiName = c.req.param("queryApiName") ?? "";

    // Look up ontology by rid or api_name
    const ontology = fs.ontologies.findOneBy("rid", ontologyId) ?? fs.ontologies.findOneBy("api_name", ontologyId);
    if (!ontology) {
      return foundryNotFound(c, "OntologyNotFound", "The given Ontology could not be found.");
    }

    const queryResult = fs.ontologyQueryResults
      .all()
      .find((q) => q.ontology_rid === ontology.rid && q.query_api_name === queryApiName);

    if (!queryResult) {
      return foundryNotFound(c, "QueryNotFound", `The query '${queryApiName}' could not be found.`);
    }

    return c.json(JSON.parse(queryResult.result_json));
  });
}

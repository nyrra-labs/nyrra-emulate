import type { PageServerLoad } from "./$types";
import { highlightAll } from "$lib/code-highlight.server";
import {
  defaultStartupServices,
  supportedServices,
  supportedServicesProse,
} from "$lib/default-services.server";
import { rootCodeBlocks } from "$lib/root-code-blocks.server";

export const prerender = true;

export const load: PageServerLoad = async () => {
  const codeBlocks = await highlightAll(rootCodeBlocks);
  return { codeBlocks, defaultStartupServices, supportedServices, supportedServicesProse };
};

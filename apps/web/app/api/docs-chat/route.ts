import { convertToModelMessages, stepCountIs, streamText } from "ai";
import type { ModelMessage, UIMessage } from "ai";
import { createBashTool } from "bash-tool";
import { headers } from "next/headers";
import { APPS_WEB_ROOT } from "@/lib/apps-web-root";
import { buildDocsChatOpeningSummary } from "@/lib/docs-chat-summary";
import { loadDocsFilesFromRoot } from "@/lib/docs-files";
import { minuteRateLimit, dailyRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

// Tool-usage rules tail of the system prompt. The opening product
// summary (supported-service list, programmatic-API mention, Next.js
// adapter mention) is composed at request time by
// `buildDocsChatOpeningSummary` in `@/lib/docs-chat-summary` so it
// stays in lockstep with the runtime SERVICE_NAMES constant and the
// upstream programmatic-api/nextjs docs pages.
const SYSTEM_PROMPT_RULES = `You have access to the full emulate documentation via the bash and readFile tools. The docs are available as markdown files in the /workspace/ directory.

When answering questions:
- Use the bash tool to list files (ls /workspace/) or search for content (grep -r "keyword" /workspace/)
- Use the readFile tool to read specific documentation pages (e.g. readFile with path "/workspace/index.md")
- Do NOT use bash to write, create, modify, or delete files (no tee, cat >, sed -i, echo >, cp, mv, rm, mkdir, touch, etc.). You are read-only
- Always base your answers on the actual documentation content
- Be concise and accurate
- If the docs don't cover a topic, say so honestly
- Do NOT include source references or file paths in your response
- Do NOT use emojis in your responses`;

function addCacheControl(messages: ModelMessage[]): ModelMessage[] {
  if (messages.length === 0) return messages;
  return messages.map((message, index) => {
    if (index === messages.length - 1) {
      return {
        ...message,
        providerOptions: {
          ...message.providerOptions,
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      };
    }
    return message;
  });
}

export async function POST(req: Request) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";

  const [minuteResult, dailyResult] = await Promise.all([minuteRateLimit.limit(ip), dailyRateLimit.limit(ip)]);

  if (!minuteResult.success || !dailyResult.success) {
    const isMinuteLimit = !minuteResult.success;
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: isMinuteLimit
          ? "Too many requests. Please wait a moment before trying again."
          : "Daily limit reached. Please try again tomorrow.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const docsFiles = await loadDocsFilesFromRoot(APPS_WEB_ROOT);
  const systemPrompt = `${buildDocsChatOpeningSummary(docsFiles)}\n\n${SYSTEM_PROMPT_RULES}`;
  const {
    tools: { bash, readFile: readFileTool },
  } = await createBashTool({ files: docsFiles });

  const result = streamText({
    model: DEFAULT_MODEL,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: { bash, readFile: readFileTool },
    prepareStep: ({ messages: stepMessages }) => ({
      messages: addCacheControl(stepMessages),
    }),
  });

  return result.toUIMessageStreamResponse();
}

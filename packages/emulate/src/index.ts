import { Command } from "commander";
import { startCommand } from "./commands/start.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";

declare const PKG_VERSION: string;
const pkg = { version: PKG_VERSION };

const defaultPort = process.env.EMULATE_PORT ?? process.env.PORT ?? "4000";

const program = new Command();

program
  .name("emulate")
  .description("Local drop-in replacement services for CI and no-network sandboxes")
  .version(pkg.version);

program
  .command("start", { isDefault: true })
  .description("Start the emulator server")
  .option("-p, --port <port>", "Base port", defaultPort)
  .option("-s, --service <services>", "Comma-separated services to enable (for example: github,foundry)")
  .option(
    "--seed <file>",
    "Path to seed config file, including service-specific blocks such as foundry.compute_modules",
  )
  .action(async (opts) => {
    const port = parseInt(opts.port, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      console.error(`Invalid port: ${opts.port}`);
      process.exit(1);
    }
    await startCommand({
      port,
      service: opts.service,
      seed: opts.seed,
    });
  });

program
  .command("init")
  .description("Generate a starter config file")
  .option(
    "-s, --service <services>",
    "Comma-separated services to include, or 'all' for every bundled starter template",
  )
  .option("--out <file>", "Write the generated YAML to a custom file path")
  .option("--stdout", "Print the generated YAML to stdout instead of writing a file")
  .option("--force", "Overwrite an existing output file")
  .option("--interactive", "Prompt for services, tokens, and output settings")
  .option("--skip-tokens", "Omit the service-specific test tokens block from the generated config")
  .action(async (opts) => {
    await initCommand({
      service: opts.service,
      out: opts.out,
      stdout: opts.stdout,
      force: opts.force,
      interactive: opts.interactive,
      tokens: opts.skipTokens ? false : undefined,
    });
  });

program
  .command("list")
  .alias("list-services")
  .description("List available services")
  .action(() => {
    listCommand();
  });

program.parse();

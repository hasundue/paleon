import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { LocalPaleonHandler } from "../mod.ts";
import * as log from "$std/log/mod.ts";

const id = Deno.env.get("DENO_DEPLOYMENT_ID") ?? "dev";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),

    paleon: await LocalPaleonHandler.init("DEBUG", {
      subject: ["paleon", id],
      broadcast: true,
    }),
  },

  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console", "paleon"],
    },
  },
});

const logger = log.getLogger();

//
// Logging middleware
//
export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  const resp = await ctx.next();

  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname + url.search;
  const status = resp.status;

  const msg = `<-- ${method} ${path}\n--> ${status}`;

  const level = status >= 400
    ? "error"
    : (path.startsWith("/_") ? "debug" : "info");

  logger[level](msg);

  return resp;
}

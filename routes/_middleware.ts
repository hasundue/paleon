import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { PaleonAppHandler } from "../mod.ts";
import * as log from "$std/log/mod.ts";

const id = Deno.env.get("DEPLOYMENT_ID");

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),

    paleon: new PaleonAppHandler("DEBUG", {
      url: id ? "https://paleon.deno.dev" : "http://localhost:8000",
      project: "paleon",
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

  if (method === "POST") {
    return resp;
  }

  const msg = `<-- ${method} ${path}\n--> ${status}`;

  const level = status >= 400
    ? "error"
    : (path.startsWith("/_") ? "debug" : "info");

  logger[level](msg);

  return resp;
}

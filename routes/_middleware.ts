import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { PaleonHandler } from "../mod.ts";
import * as log from "$std/log/mod.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),

    paleon: new PaleonHandler("DEBUG", {
      url: "http://localhost:8000",
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
  const pathname = new URL(req.url).pathname;
  const status = resp.status;

  if (method === "POST") {
    return resp;
  }

  const msg = `<-- ${method} ${pathname}\n--> ${status}`;

  if (status >= 400) {
    logger.error(msg);
  } else if (pathname.startsWith("/_")) {
    logger.debug(msg);
  } else {
    logger.info(msg);
  }

  const level = status >= 400
    ? "error"
    : (pathname.startsWith("/_") ? "debug" : "info");

  logger[level](msg);

  return resp;
}

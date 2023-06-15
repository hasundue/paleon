import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { BaseHandler, type HandlerOptions } from "$std/log/handlers.ts";
import {
  getLogger,
  handlers,
  type LevelName,
  type LogRecord,
  setup,
} from "$std/log/mod.ts";
import { PaleonStorage } from "../mod.ts";
import { PaleonAppPayload, PaleonAppRecord } from "../shared/api.ts";

const DEPLOYMENT_ID = Deno.env.get("DENO_DEPLOYMENT_ID") ?? "dev";

/**
 * A handler that writes log records to a local Paleon storage.
 */
class LocalPaleonHandler extends BaseHandler {
  readonly #_paleon: PaleonStorage<PaleonAppRecord>;

  constructor(
    paleon: PaleonStorage<PaleonAppRecord>,
    levelName: LevelName,
    options?: HandlerOptions,
  ) {
    super(levelName, options);
    this.#_paleon = paleon;
  }

  static async init(
    levelName: LevelName,
    options?: HandlerOptions,
  ) {
    const paleon = await PaleonStorage.open<PaleonAppRecord>(
      ["paleon", DEPLOYMENT_ID],
    );
    return new LocalPaleonHandler(paleon, levelName, options);
  }

  override handle(logRecord: LogRecord): Promise<Deno.KvCommitResult> {
    const payload = PaleonAppPayload.fromLogRecord(logRecord);

    const ch = new BroadcastChannel(`paleon/${DEPLOYMENT_ID}`);
    ch.postMessage(JSON.stringify(payload));

    return this.#_paleon.write(PaleonAppRecord.fromPayload(payload));
  }
}

setup({
  handlers: {
    console: new handlers.ConsoleHandler("DEBUG"),
    paleon: await LocalPaleonHandler.init("DEBUG"),
  },

  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console", "paleon"],
    },
  },
});

const logger = getLogger();

/**
 * Logging middleware
 */
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

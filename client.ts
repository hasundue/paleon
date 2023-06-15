import type { LevelName } from "$std/log/levels.ts";
import type { LogRecord } from "$std/log/logger.ts";
import { BaseHandler, HandlerOptions } from "$std/log/handlers.ts";
import { PaleonAppPayload } from "./shared/api.ts";

export interface PaleonAppInit {
  project: string;
  url?: string;
  id?: string;
}

/**
 * A handler that sends log records to the Paleon app.
 */
export class PaleonAppHandler extends BaseHandler {
  protected readonly _url: string;
  protected readonly _project: string;
  protected readonly _id: string;

  constructor(
    levelName: LevelName,
    options: HandlerOptions & PaleonAppInit,
  ) {
    super(levelName, options);

    this._url = options.url ?? "https://paleon.deno.dev";
    this._project = options.project;
    this._id = options.id ?? Deno.env.get("DENO_DEPLOYMENT_ID") ?? "dev";
  }

  override async handle(logRecord: LogRecord) {
    const payload = PaleonAppPayload.from(logRecord);

    const res = await fetch(`${this._url}/${this._project}/${this._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to send log to Paleon", { cause: res });
    }
  }
}

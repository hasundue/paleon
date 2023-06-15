import type { LevelName } from "$std/log/levels.ts";
import type { LogRecord } from "$std/log/logger.ts";
import { BaseHandler, HandlerOptions } from "$std/log/handlers.ts";
import {
  PaleonAppPayload,
  PaleonAppRecord,
  PaleonAppRequestOptions,
} from "./shared/api.ts";

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
    init: PaleonAppInit & HandlerOptions,
  ) {
    super(levelName, init);

    this._url = init.url ?? "https://paleon.deno.dev";
    this._project = init.project;
    this._id = init.id ?? Deno.env.get("DENO_DEPLOYMENT_ID") ?? "dev";
  }

  override async handle(logRecord: LogRecord) {
    const payload = PaleonAppPayload.fromLogRecord(logRecord);

    const res = await fetch(`${this._url}/${this._project}/${this._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to send log to Paleon", {
        cause: await res.json(),
      });
    }
  }
}

export class PaleonClient {
  readonly url: string;
  readonly project: string;
  readonly id: string;

  constructor(init: PaleonAppInit) {
    this.url = init.url ?? "https://paleon.deno.dev";
    this.project = init.project;
    this.id = init.id ?? Deno.env.get("DENO_DEPLOYMENT_ID") ?? "dev";
  }

  listen(options: PaleonAppRequestOptions): ReadableStream<PaleonAppRecord> {
    const params = new URLSearchParams({
      ...options,
      limit: options.limit.toString(),
      reverse: options.reverse.toString(),
    });

    const url = new URL(`${this.url}/${this.project}/${this.id}`);
    url.search = params.toString();

    const source = new EventSource(url);

    return new ReadableStream<PaleonAppRecord>({
      start(controller) {
        source.addEventListener("message", (e) => {
          controller.enqueue(
            PaleonAppRecord.fromPayload(JSON.parse(e.data)),
          );
        });
        source.addEventListener("close", () => {
          controller.close();
        });
        source.addEventListener("error", () => {
          controller.close();
        });
      },
      cancel() {
        source.close();
      },
    });
  }

  async read(options: PaleonAppRequestOptions): Promise<PaleonAppRecord[]> {
    const params = new URLSearchParams({
      ...options,
      limit: options.limit.toString(),
      reverse: options.reverse.toString(),
    });

    const url = new URL(`${this.url}/${this.project}/${this.id}`);
    url.search = params.toString();

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!resp.ok) {
      throw new Error("Failed to fetch logs from Paleon App", {
        cause: await resp.json(),
      });
    }

    const items = await resp.json() as PaleonAppPayload[];

    return items.map((item) => PaleonAppRecord.fromPayload(item));
  }
}

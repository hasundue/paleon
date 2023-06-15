import { BaseHandler, HandlerOptions } from "$std/log/handlers.ts";
import { type LevelName } from "$std/log/levels.ts";
import { type LogRecord } from "$std/log/logger.ts";
import { PaleonAppPayload } from "./shared/api.ts";

export type PaleonStorageRecord = {
  datetime: Date;
};

export interface PaleonStorageReadOptions {
  since?: Date;
  until?: Date;
  limit?: number;
  reverse?: boolean;
}

/**
 * Interface for a storage of time series data.
 */
export type PaleonStorage<
  T extends PaleonStorageRecord = PaleonStorageRecord,
> = {
  readonly subject: Deno.KvKey | Deno.KvKeyPart;
  read(options?: PaleonStorageReadOptions): ReadableStream<T>;
  write(value: T): Promise<Deno.KvCommitResult>;
  erase(): Promise<void>;
  close(): void;
};

export const PaleonStorage = {
  async open<T extends PaleonStorageRecord>(
    subject: Deno.KvKey | Deno.KvKeyPart,
  ): Promise<PaleonStorage<T>> {
    const prefix = [subject].flat();
    const kv = await Deno.openKv();

    return {
      subject,

      write(record: T) {
        const time = record.datetime.getTime();
        const key = [...prefix, time, crypto.randomUUID()];
        return kv.set(key, record);
      },

      read(options?: PaleonStorageReadOptions) {
        const start = [...prefix, options?.since?.getTime() ?? 0];
        const end = [...prefix, options?.until?.getTime() ?? Infinity];
        const limit = options?.limit;
        const reverse = options?.reverse ?? true;

        const iter = kv.list<T>({ start, end }, { limit, reverse });

        return new ReadableStream<T>({
          async start(controller) {
            for await (const { value } of iter) {
              controller.enqueue(value);
            }
            controller.close();
          },
        });
      },

      async erase() {
        for await (const { key } of kv.list<T>({ prefix })) {
          await kv.delete(key);
        }
      },

      close() {
        kv.close();
      },
    };
  },
};

interface LocalPaleonHandlerInit {
  subject: Deno.KvKey | Deno.KvKeyPart;
  broadcast?: boolean;
}

/**
 * A handler that writes log records to a local Paleon storage.
 */
export class LocalPaleonHandler extends BaseHandler {
  readonly #_paleon: PaleonStorage;
  protected readonly _subject: Deno.KvKey;
  protected readonly _broadcast?: boolean;

  constructor(
    paleon: PaleonStorage,
    levelName: LevelName,
    options: HandlerOptions & LocalPaleonHandlerInit,
  ) {
    super(levelName, options);
    this.#_paleon = paleon;
    this._subject = [options.subject].flat();
    this._broadcast = options.broadcast;
  }

  static async init<T extends LogRecord = LogRecord>(
    levelName: LevelName,
    options: HandlerOptions & LocalPaleonHandlerInit,
  ) {
    const paleon = await PaleonStorage.open<T>([options.subject].flat());
    return new LocalPaleonHandler(paleon, levelName, options);
  }

  override handle(logRecord: LogRecord): Promise<Deno.KvCommitResult> {
    if (this._broadcast) {
      const ch = new BroadcastChannel(this._subject.join("/"));
      const payload = PaleonAppPayload.from(logRecord);
      ch.postMessage(JSON.stringify(payload));
    }
    return this.#_paleon.write(logRecord);
  }
}

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

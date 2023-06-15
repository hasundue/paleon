import { BaseHandler, HandlerOptions } from "$std/log/handlers.ts";
import { type LevelName } from "$std/log/levels.ts";
import { type LogRecord } from "$std/log/logger.ts";

export type PaleonStorage<
  T extends PaleonStorageRecord = PaleonStorageRecord,
> = {
  readonly subject: Deno.KvKey | Deno.KvKeyPart;
  read(options?: PaleonStorageReadOptions): ReadableStream<T>;
  write(value: T): Promise<Deno.KvCommitResult>;
  erase(): Promise<void>;
  close(): void;
};

export type PaleonStorageRecord = {
  datetime: Date;
};

export const PaleonStorageRecord = {
  fromPayload(payload: PaleonPayload): PaleonStorageRecord {
    return {
      ...payload,
      datetime: new Date(payload.datetime),
    };
  },
};

export interface PaleonStorageReadOptions {
  since?: Date;
  until?: Date;
  limit?: number;
  reverse?: boolean;
}

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
        const limit = options?.limit ?? 10;
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

export class LocalPaleonHandler extends BaseHandler {
  readonly #_paleon: PaleonStorage;

  constructor(
    paleon: PaleonStorage,
    levelName: LevelName,
    options?: HandlerOptions,
  ) {
    super(levelName, options);
    this.#_paleon = paleon;
  }

  static async init<T extends LogRecord = LogRecord>(
    levelName: LevelName,
    options?: HandlerOptions,
  ) {
    const paleon = await PaleonStorage.open<T>("logs");
    return new LocalPaleonHandler(paleon, levelName, options);
  }

  override handle(logRecord: LogRecord): Promise<Deno.KvCommitResult> {
    return this.#_paleon.write(logRecord);
  }
}

export type PaleonPayload = Record<string, unknown> & {
  datetime: number;
};

export const PaleonPayload = {
  fromLogRecord(record: LogRecord): PaleonPayload {
    return {
      ...record,
      args: record.args,
      datetime: record.datetime.getTime(),
    };
  },
};

export interface PaleonHandlerOptions {
  project: string;
  url?: string;
  id?: string;
}

export class PaleonHandler extends BaseHandler {
  readonly url: string;
  readonly project: string;
  readonly id: string;

  constructor(
    levelName: LevelName,
    options: HandlerOptions & PaleonHandlerOptions,
  ) {
    super(levelName, options);

    this.url = options.url ?? "https://paleon.deno.dev";
    this.project = options.project;
    this.id = options.id ?? Deno.env.get("DEPLOYMENT_ID") ?? "dev";
  }

  override async handle(logRecord: LogRecord) {
    const payload = PaleonPayload.fromLogRecord(logRecord);

    const res = await fetch(`${this.url}/${this.project}/${this.id}`, {
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

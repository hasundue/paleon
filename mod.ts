import { BaseHandler, HandlerOptions } from "$std/log/handlers.ts";
import { type LevelName } from "$std/log/levels.ts";
import { type LogRecord } from "$std/log/logger.ts";

export type Paleon<T extends PaleonRecord = PaleonRecord> = {
  readonly subject: Deno.KvKey | Deno.KvKeyPart;
  read(options?: ReadOptions): ReadableStream<T>;
  write(value: T): Promise<Deno.KvCommitResult>;
  erase(): Promise<void>;
  close(): void;
};

export interface PaleonRecord {
  datetime: Date;
}

export type ReadOptions = {
  since?: Date;
  until?: Date;
  limit?: number;
  reverse?: boolean;
};

export const Paleon = {
  async open<T extends PaleonRecord>(
    subject: Deno.KvKey | Deno.KvKeyPart,
  ): Promise<Paleon<T>> {
    const prefix = [subject].flat();
    const kv = await Deno.openKv();

    return {
      subject,

      write(record: T) {
        const time = record.datetime.getTime();
        const key = [...prefix, time, crypto.randomUUID()];
        return kv.set(key, record);
      },

      read(options?: ReadOptions) {
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

export class PaleonHandler extends BaseHandler {
  readonly #_paleon: Paleon;

  constructor(paleon: Paleon, levelName: LevelName, options?: HandlerOptions) {
    super(levelName, options);
    this.#_paleon = paleon;
  }

  static async init<T extends LogRecord = LogRecord>(
    levelName: LevelName,
    options?: HandlerOptions,
  ) {
    const paleon = await Paleon.open<T>("logs");
    return new PaleonHandler(paleon, levelName, options);
  }

  override handle(logRecord: LogRecord): Promise<Deno.KvCommitResult> {
    return this.#_paleon.write(logRecord);
  }
}

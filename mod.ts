export type Log<T = unknown> = {
  readonly subject: Deno.KvKey | Deno.KvKeyPart;
  read(options?: LogReadOptions): ReadableStream<LogRecord<T>>;
  write(value: T, options?: LogWriteOptions): Promise<Deno.KvCommitResult>;
  erase(): Promise<void>;
  close(): void;
};

export type LogReadOptions = { since?: Date; until?: Date };
export type LogWriteOptions = { time?: number; hash?: string };

export type LogRecord<T = unknown> = {
  date: Date;
  body: T;
};

export const Log = {
  async on<T = unknown>(subject: Deno.KvKey | Deno.KvKeyPart): Promise<Log<T>> {
    const prefix = [subject].flat();
    const kv = await Deno.openKv();
    const encoder = new TextEncoder();

    return {
      async write(
        value: T,
        options?: { time?: number; hash?: string },
      ) {
        const time = options?.time ?? Date.now();
        const hash = options?.hash ?? String(
          await crypto.subtle.digest(
            "SHA-256",
            encoder.encode(JSON.stringify(value)),
          ),
        );
        const key = [...prefix, time, hash];
        return kv.set(key, value);
      },

      read(
        options?: { since?: Date; until?: Date },
      ) {
        const start = [...prefix, options?.since?.getTime() ?? 0];
        const end = [...prefix, options?.until?.getTime() ?? Infinity];

        const iter = kv.list<T>({ start, end });

        return new ReadableStream<LogRecord<T>>({
          async start(controller) {
            for await (const { key, value } of iter) {
              controller.enqueue({
                date: new Date(key[1] as number),
                body: value,
              });
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

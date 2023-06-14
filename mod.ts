export type Log<T = unknown> = {
  readonly subject: Deno.KvKey | Deno.KvKeyPart;
  read(options?: ReadOptions): ReadableStream<LogRecord<T>>;
  write(value: T, options?: WriteOptions): Promise<Deno.KvCommitResult>;
  erase(): Promise<void>;
  close(): void;
};

export type ReadOptions = { since?: Date; until?: Date; limit?: number };
export type WriteOptions = { time?: number };

export type LogRecord<T = unknown> = {
  time: number;
  body: T;
};

export const Log = {
  async open<T = unknown>(
    subject: Deno.KvKey | Deno.KvKeyPart,
  ): Promise<Log<T>> {
    const prefix = [subject].flat();
    const kv = await Deno.openKv();

    return {
      subject,

      write(value: T, options?: WriteOptions) {
        const time = options?.time ?? Date.now();
        const key = [...prefix, time, crypto.randomUUID()];
        return kv.set(key, value);
      },

      read(options?: ReadOptions) {
        const start = [...prefix, options?.since?.getTime() ?? 0];
        const end = [...prefix, options?.until?.getTime() ?? Infinity];
        const limit = options?.limit ?? 10;

        const iter = kv.list<T>({ start, end }, { limit, reverse: true });

        return new ReadableStream<LogRecord<T>>({
          async start(controller) {
            for await (const { key, value } of iter) {
              controller.enqueue({
                time: Number(key[prefix.length]),
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

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

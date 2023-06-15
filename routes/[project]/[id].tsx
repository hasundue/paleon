import { Handlers, PageProps } from "$fresh/server.ts";
import {
  ServerSentEvent,
  ServerSentEventStreamTarget,
} from "$std/http/server_sent_event.ts";
import { collect } from "$streamtools/collect.ts";
import { PaleonStorage } from "../../mod.ts";
import { DateTime } from "../../shared/datetime.ts";
import {
  LogLevel,
  LogLevelMap,
  LogPeriod,
  PaleonAppPayload,
  PaleonAppRecord,
  PaleonAppRecordItem,
  PaleonAppRequestOptions,
} from "../../shared/api.ts";
import Head from "../../components/Head.tsx";
import Header from "../../components/Header.tsx";
import LogView from "../../islands/LogView.tsx";

type LogsProps = PageProps<{
  init: PaleonAppRecordItem[];
  options: PaleonAppRequestOptions;
}>;

export const handler: Handlers = {
  async GET(req, ctx) {
    const { project, id } = ctx.params;

    const params = new URL(req.url).searchParams;

    const options: PaleonAppRequestOptions = {
      region: params.get("region") ?? "all",
      level: params.get("level") as LogLevel | null ?? "info",
      period: params.get("period") as LogPeriod | null ?? "day",
      limit: Number(params.get("limit") ?? "10"),
      reverse: params.get("reverse") === "false" ? false : true,
    };

    const _options = {
      level: LogLevelMap[options.level],
      since: DateTime.ago[options.period],
    };

    // Server-Sent Events for hydration
    if (req.headers.get("accept") === "text/event-stream") {
      const target = new ServerSentEventStreamTarget();
      const ch = new BroadcastChannel(`${project}/${id}`);

      ch.addEventListener("message", (ev: MessageEvent<string>) => {
        const payload = JSON.parse(ev.data) as PaleonAppPayload;
        const record = PaleonAppRecord.fromPayload(payload);

        if (
          record.level >= _options.level && record.datetime >= _options.since
        ) {
          const ev = new ServerSentEvent("message", {
            data: JSON.stringify(PaleonAppRecordItem.from(record)),
          });
          target.dispatchEvent(ev);
        }
      });

      target.addEventListener("close", () => {
        ch.close();
      });
      target.addEventListener("error", () => {
        ch.close();
      });

      return target.asResponse();
    }

    // SSR of initial data
    const storage = await PaleonStorage.open<PaleonAppRecord>([project, id]);
    let count = 0;

    const records = storage.read({
      since: _options.since,
      reverse: options.reverse,
    });

    if (req.headers.get("accept") === "application/json") {
      const payloads = (await collect(records)).map((record) =>
        PaleonAppRecordItem.from(record)
      );
      return Response.json(payloads);
    }

    const items = records.pipeThrough(
      new TransformStream<PaleonAppRecord, PaleonAppRecordItem>({
        transform(record, controller) {
          if (record.level >= _options.level) {
            count++;
            controller.enqueue(PaleonAppRecordItem.from(record));
            if (count >= options.limit) {
              controller.terminate();
            }
          }
        },
      }),
    );

    return ctx.render({ init: await collect(items), options });
  },

  async POST(req, ctx) {
    const { project, id } = ctx.params;

    const payload = await req.json() as PaleonAppPayload;
    const record = PaleonAppRecord.fromPayload(payload);

    const ch = new BroadcastChannel(`${project}/${id}`);
    ch.postMessage(JSON.stringify(payload));

    const storage = await PaleonStorage.open<PaleonAppRecord>([project, id]);
    await storage.write(record);
    storage.close();

    return Response.json({ ok: true });
  },
};

export default function Logs(props: LogsProps) {
  const { project, id } = props.params;
  const { init, options } = props.data;

  return (
    <>
      <Head />
      <body>
        <Header current="Logs" />
        <div>
          <h2>🔎 Logs</h2>
        </div>
        <LogView project={project} id={id} init={init} options={options} />
      </body>
    </>
  );
}

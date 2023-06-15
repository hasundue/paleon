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
  LogViewOptions,
  PaleonAppPayload,
  PaleonAppRecord,
  PaleonAppRecordItem,
} from "../../shared/api.ts";
import Head from "../../components/Head.tsx";
import Header from "../../components/Header.tsx";
import LogView from "../../islands/LogView.tsx";

type AppProps = PageProps<{
  init: PaleonAppRecordItem[];
  options: LogViewOptions;
}>;

export const handler: Handlers = {
  async GET(req, ctx) {
    const { project, id } = ctx.params;

    const params = new URL(req.url).searchParams;

    const options: LogViewOptions = {
      region: params.get("region") ?? "all",
      level: params.get("level") as LogLevel | null ?? "info",
      period: params.get("period") as LogPeriod | null ?? "day",
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
        const record = PaleonAppRecord.from(payload);

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

    const items = storage.read({ since: _options.since }).pipeThrough(
      new TransformStream<PaleonAppRecord, PaleonAppRecordItem>({
        transform(record, controller) {
          if (record.level >= _options.level) {
            controller.enqueue(PaleonAppRecordItem.from(record));
          }
        },
      }),
    );

    return ctx.render({ init: await collect(items), options });
  },

  async POST(req, ctx) {
    const { project, id } = ctx.params;

    const payload = await req.json() as PaleonAppPayload;
    const record = PaleonAppRecord.from(payload);

    const ch = new BroadcastChannel(`${project}/${id}`);
    ch.postMessage(JSON.stringify(payload));

    const storage = await PaleonStorage.open<PaleonAppRecord>([project, id]);
    await storage.write(record);
    storage.close();

    return Response.json({ ok: true });
  },
};

export default function Logs(props: AppProps) {
  const { project, id } = props.params;
  const { init, options } = props.data;

  return (
    <>
      <Head />
      <body>
        <Header current="Logs" />
        <div>
          <h3>🔎 Logs</h3>
          <LogView project={project} id={id} init={init} options={options} />
        </div>
      </body>
    </>
  );
}

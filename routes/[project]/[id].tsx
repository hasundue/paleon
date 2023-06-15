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
      period: params.get("since") as LogPeriod | null ?? "day",
      reverse: params.get("reverse") === "false" ? false : true,
    };

    const _options = {
      level: LogLevelMap[options.level],
      since: DateTime.ago[options.period],
    };

    const storage = await PaleonStorage.open<PaleonAppRecord>([project, id]);
    const records = storage.read({ since: _options.since });

    const target = new ServerSentEventStreamTarget();

    if (req.headers.get("accept") === "text/event-stream") {
      await records.pipeTo(
        new WritableStream({
          write(record) {
            if (record.level >= _options.level) {
              const ev = new ServerSentEvent("message", {
                data: PaleonAppRecordItem.from(record),
              });
              target.dispatchEvent(ev);
            }
          },
        }),
      );
      target.addEventListener("close", () => {
        storage.close();
      });
      return target.asResponse();
    }

    const items = records.pipeThrough(
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

    const storage = await PaleonStorage.open<PaleonAppRecord>([project, id]);
    const payload = await req.json() as PaleonAppPayload;
    const record = PaleonAppRecord.from(payload);

    storage.write(record);
    storage.close();

    return Response.json({ status: 201 });
  },
};

export default function App(props: AppProps) {
  const { project, id } = props.params;
  const { init, options } = props.data;

  return (
    <>
      <Head />
      <body>
        <Header current="App" />
        <div>
          <h3>🔎 Logs</h3>
          <LogView project={project} id={id} init={init} options={options} />
        </div>
      </body>
    </>
  );
}

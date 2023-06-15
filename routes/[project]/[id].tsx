import { Handlers, PageProps } from "$fresh/server.ts";
import {
  ServerSentEvent,
  ServerSentEventStreamTarget,
} from "$std/http/server_sent_event.ts";
import { collect } from "$streamtools/collect.ts";
import { PaleonPayload, PaleonStorage } from "../../mod.ts";
import { AppLogRecord, AppLogRecordItem } from "../../shared/api.ts";
import Head from "../../components/Head.tsx";
import Header from "../../components/Header.tsx";
import LogView from "../../islands/LogView.tsx";

type AppProps = PageProps<{
  init: AppLogRecordItem[];
}>;

export const handler: Handlers = {
  async GET(req, ctx) {
    const { project, id } = ctx.params;

    const storage = await PaleonStorage.open<AppLogRecord>([project, id]);
    const records = storage.read({ limit: 10 });

    const target = new ServerSentEventStreamTarget();

    if (req.headers.get("accept") === "text/event-stream") {
      await records.pipeTo(
        new WritableStream({
          write(record) {
            const ev = new ServerSentEvent("message", {
              data: AppLogRecordItem.from(record),
            });
            target.dispatchEvent(ev);
          },
        }),
      );
      target.addEventListener("close", () => {
        storage.close();
      });
      return target.asResponse();
    }

    const items = records.pipeThrough(
      new TransformStream<AppLogRecord, AppLogRecordItem>({
        transform(record, controller) {
          controller.enqueue(AppLogRecordItem.from(record));
        },
      }),
    );

    return ctx.render({ init: await collect(items) });
  },

  async POST(req, ctx) {
    const { project, id } = ctx.params;

    const storage = await PaleonStorage.open<AppLogRecord>([project, id]);
    const payload = await req.json() as PaleonPayload;
    const record = AppLogRecord.from(payload);

    storage.write(record);
    storage.close();

    return Response.json({ status: 201 });
  },
};

export default function App(props: AppProps) {
  const { project, id } = props.params;

  return (
    <>
      <Head />
      <body>
        <header style="padding-bottom: 0">
          <Header current="App" />
        </header>
        <div>
          <h3>🔎 Logs</h3>
          <LogView options={{ project, id }} init={props.data.init} />
        </div>
      </body>
    </>
  );
}

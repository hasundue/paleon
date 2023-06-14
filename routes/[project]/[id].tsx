import { Handlers, PageProps } from "$fresh/server.ts";
import { format } from "$std/datetime/format.ts";
import {
  ServerSentEvent,
  ServerSentEventStreamTarget,
} from "$std/http/server_sent_event.ts";
import { collect } from "$streamtools/collect.ts";
import { Log, LogRecord } from "/mod.ts";
import { RecordItem } from "/shared/api.ts";
import Head from "/components/Head.tsx";
import Header from "/components/Header.tsx";
import LogView from "/islands/LogView.tsx";

type AppProps = PageProps<{
  init: RecordItem[];
}>;

export const handler: Handlers = {
  async GET(req, ctx) {
    const target = new ServerSentEventStreamTarget();

    const log = await Log.open<string>(["paleon", "dev"]);
    const records = log.read();

    if (req.headers.get("accept") === "text/event-stream") {
      await records.pipeTo(
        new WritableStream({
          write(record) {
            const ev = new ServerSentEvent("message", {
              data: {
                body: record.body,
                timestamp: format(
                  new Date(record.time),
                  "yyyy-MM-dd HH:mm:ss",
                ),
              },
            });
            target.dispatchEvent(ev);
          },
        }),
      );
      target.addEventListener("close", () => {
        log.close();
      });
      return target.asResponse();
    }

    const items = records.pipeThrough(
      new TransformStream<LogRecord<string>, RecordItem>({
        transform(record: LogRecord<string>, controller) {
          controller.enqueue({
            body: record.body,
            timestamp: format(new Date(record.time), "yyyy-MM-dd HH:mm:ss"),
          });
        },
      }),
    );

    return ctx.render({ init: await collect(items) });
  },
};

export default function App(props: AppProps) {
  const { project, id } = props.params;

  return (
    <>
      <Head />
      <body>
        <header style="padding-bottom: 0">
          <Header current="Home" />
        </header>
        <div>
          <h3>🔎 Logs</h3>
          <LogView options={{ project, id }} init={props.data.init} />
        </div>
      </body>
    </>
  );
}

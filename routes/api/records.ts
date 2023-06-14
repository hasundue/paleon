import { format } from "$std/datetime/format.ts";
import {
  ServerSentEvent,
  ServerSentEventStreamTarget,
} from "$std/http/server_sent_event.ts";
import { HandlerContext } from "$fresh/server.ts";
import { Log } from "/mod.ts";

export const handler = (req: Request, _ctx: HandlerContext) => {
  switch (req.method) {
    case "GET":
      return get(req);
    default:
      return new Response("Method not allowed", { status: 405 });
  }
};

export type EventData = {
  body: string;
  timestamp: string;
};

const get = async (_req: Request) => {
  const target = new ServerSentEventStreamTarget();

  const log = await Log.open<string>(["paleon", "dev"]);
  const aborter = new AbortController();

  await log.read().pipeTo(
    new WritableStream({
      write(record) {
        const ev = new ServerSentEvent(
          "message",
          {
            data: {
              body: record.body,
              timestamp: format(new Date(record.time), "yyyy-MM-dd HH:mm:ss"),
            },
          },
        );
        target.dispatchEvent(ev);
      },
    }),
    { signal: aborter.signal },
  );

  target.addEventListener("close", () => {
    aborter.abort();
    log.close();
  });

  return target.asResponse();
};

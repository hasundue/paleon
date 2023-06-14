import { PageProps } from "$fresh/server.ts";
import { LogRecord } from "../../mod.ts";

export default function Records(
  props: PageProps<{ records: ReadableStream<LogRecord<string>> }>,
) {
  return <div>Hello</div>;
}

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { LogRecord } from "../mod.ts";

interface RecordsProps {
  project: string;
  id: string;
}

export default function Records(props: RecordsProps) {
  const records = useSignal<LogRecord[]>([]);

  useEffect(() => {
    const source = new EventSource(
      new URL("/api/records", window.location.href),
    );
    source.onmessage = (ev) => {
      const record = JSON.parse(ev.data) as LogRecord;
      records.value = [...records.value, record];
    };
  }, [props]);

  return (
    <div>
      <h2>Logs</h2>
      {records.value.length > 0 &&
        (
          <ul>
            {records.value.map((record) => (
              <li>
                {record.body} at {new Date(record.time).toString()}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

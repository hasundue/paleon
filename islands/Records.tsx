import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { EventData } from "../routes/api/records.ts";

interface RecordsProps {
  project: string;
  id: string;
}

export default function Records(props: RecordsProps) {
  const records = useSignal<EventData[]>([]);

  useEffect(() => {
    records.value = [];
    const source = new EventSource(
      new URL("/api/records", window.location.href),
    );
    source.onmessage = (ev) => {
      const record = JSON.parse(ev.data) as EventData;
      records.value = [...records.value, record];
    };
  }, [props]);

  return (
    <div>
      {records.value.length > 0 &&
        (
          <ul>
            {records.value.map((record) => (
              <li>
                {record.body} at {record.timestamp}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

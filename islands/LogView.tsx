import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { EventData } from "../routes/api/records.ts";
import { Select } from "../components/Select.tsx";

interface RecordsProps {
  project: string;
  id: string;
  since?: Date;
  until?: Date;
}

export default function LogView(props: RecordsProps) {
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
    <>
      <div name="options">
        <Select
          name="Region"
          options={[
            { value: "all", text: "All regions" },
          ]}
        />
        <Select
          name="Log Level"
          options={[
            { value: "debug", text: "Debug" },
          ]}
        />
        <Select
          name="Period"
          options={[
            { value: "day", text: "Day" },
          ]}
        />
      </div>

      {records.value.length > 0 &&
        records.value.map((record) => (
          <pre style="padding-top: 0.1rem; padding-bottom: 0.1rem">
            <code>
              <p>{record.body}</p>
              <p style="color: grey; font-size: 0.96rem; text-align: right">
                {record.timestamp} @ region
              </p>
            </code>
          </pre>
        ))}
    </>
  );
}

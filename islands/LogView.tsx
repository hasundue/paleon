import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { AppLogRecordItem } from "../shared/api.ts";
import { Select } from "../components/Select.tsx";

interface LogViewProps {
  init: AppLogRecordItem[];
  options: {
    project: string;
    id: string;
    since?: Date;
    until?: Date;
  };
}

export default function LogView(props: LogViewProps) {
  const options = useSignal(props.options);
  const records = useSignal<AppLogRecordItem[]>(props.init);

  useEffect(() => {
    records.value = [];
    const source = new EventSource(
      new URL(window.location.href),
    );
    source.onmessage = (ev) => {
      const record = JSON.parse(ev.data) as AppLogRecordItem;
      records.value = [...records.value, record];
    };
  }, [options]);

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
            { value: "info", text: "Info", selected: true },
            { value: "warn", text: "Warn" },
            { value: "error", text: "Error" },
          ]}
        />
        <Select
          name="Period"
          options={[
            { value: "hour", text: "Hour" },
            { value: "day", text: "Day", selected: true },
            { value: "week", text: "Week" },
            { value: "month", text: "Month" },
          ]}
        />
      </div>

      {records.value.map((record) => (
        <pre style="padding-top: 0.1rem; padding-bottom: 0.1rem">
          <code>
            <p>
              {record.msg}
            </p>
            <p style="color: grey; font-size: 0.96rem; text-align: right">
              {record.datetime} @ region
            </p>
          </code>
        </pre>
      ))}
    </>
  );
}

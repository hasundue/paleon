import { JSX } from "preact/jsx-runtime";
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import {
  LOG_LEVELS,
  LOG_PERIODS,
  LogViewProps,
  PaleonAppRecordItem,
} from "../shared/api.ts";
import { Select } from "../components/Select.tsx";

export default function LogView(props: LogViewProps) {
  // const options = useSignal(props.options);
  const records = useSignal<PaleonAppRecordItem[]>(props.init);

  // useEffect(() => {
  //   records.value = [];

  //   const level = options.value?.level ?? INFO;

  //   const source = new EventSource(
  //     window.location.href + `?level=${level}`,
  //   );

  //   source.onmessage = (ev) => {
  //     const record = JSON.parse(ev.data) as PaleonAppRecordItem;
  //     records.value = [...records.value, record];
  //   };
  // }, [options]);

  const submit: JSX.GenericEventHandler<HTMLSelectElement> = () => {
    const form = document.getElementById("options") as HTMLFormElement;
    form.submit();
  };

  return (
    <>
      <form id="options" method="GET">
        <Select
          name="region"
          label="Region"
          options={[
            { value: "all", text: "All regions" },
          ]}
          onChange={submit}
        />
        <Select
          name="level"
          label="Log Level"
          options={LOG_LEVELS.map((level) => ({
            value: level,
            text: level[0].toUpperCase() + level.slice(1),
            selected: props.options.level === level ? true : undefined,
          }))}
          onChange={submit}
        />
        <Select
          name="period"
          label="Period"
          options={LOG_PERIODS.map((period) => ({
            value: period,
            text: period[0].toUpperCase() + period.slice(1),
            selected: props.options.period === period ? true : undefined,
          }))}
          onChange={submit}
        />
      </form>

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

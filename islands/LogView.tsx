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
  const items = useSignal<PaleonAppRecordItem[]>(props.init);

  useEffect(() => {
    const source = new EventSource(
      window.location.href,
    );
    source.addEventListener("message", (ev: MessageEvent<string>) => {
      const item = JSON.parse(ev.data) as PaleonAppRecordItem;
      items.value = props.options.reverse
        ? [item, ...items.value]
        : [...items.value, item];
    });
    source.addEventListener("error", () => {
      source.close();
    });
  }, [props]);

  const submit: JSX.GenericEventHandler<HTMLSelectElement> = () => {
    const form = document.getElementById("options") as HTMLFormElement;
    form.submit();
  };

  return (
    <>
      <form id="options" method="GET">
        <Select
          name="region"
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
            selected: props.options.level === level ? true : undefined,
          }))}
          onChange={submit}
        />
        <Select
          name="period"
          options={LOG_PERIODS.map((period) => ({
            value: period,
            selected: props.options.period === period ? true : undefined,
          }))}
          onChange={submit}
        />
        <Select
          name="limit"
          label="Limit"
          options={[10, 20, 50, 100].map((limit) => ({
            value: limit.toString(),
            selected: props.options.limit === limit ? true : undefined,
          }))}
          onChange={submit}
        />
      </form>

      {items.value.map((item) => (
        <pre style="padding-top: 0.1rem; padding-bottom: 0.1rem">
          <code>
            <p>
              {item.msg}
            </p>
            <p style="color: grey; font-size: 0.96rem; text-align: right">
              {item.datetime} @ {item.region}
            </p>
          </code>
        </pre>
      ))}
    </>
  );
}

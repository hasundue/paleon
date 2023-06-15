import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

type SelectProps = {
  name: string;
  options?: SelectOption[];
} & JSX.HTMLAttributes<HTMLSelectElement>;

type SelectOption = {
  value: string;
  text?: string;
  selected?: true;
};

export function Select(props: SelectProps) {
  const options = props.options ?? [];

  return (
    <select
      style="margin-right: 0.48rem"
      {...props}
      disabled={!IS_BROWSER || props.disabled}
    >
      <option disabled>
        {props.label ?? props.name[0].toUpperCase() + props.name.slice(1)}
      </option>

      {options.map((it) => (
        <option
          value={it.value}
          selected={it.selected}
        >
          {it.text ?? it.value}
        </option>
      ))}
    </select>
  );
}

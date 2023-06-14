import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

type SelectOption = {
  value: string;
  text?: string;
  selected?: true;
};

type SelectProps = {
  name: string;
  options?: SelectOption[];
} & JSX.HTMLAttributes<HTMLSelectElement>;

export function Select(props: SelectProps) {
  const options = props.options ?? [];

  return (
    <select
      style="margin-right: 0.48rem"
      {...props}
      disabled={!IS_BROWSER || props.disabled}
    >
      <option disabled>{props.name}</option>

      {options.map((it) => (
        <option 
          value={it.value}
          selected={it.selected}
        >{it.text ?? it.value}</option>
      ))}
    </select>
  );
}


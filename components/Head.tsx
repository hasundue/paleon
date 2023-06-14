import { Head as BaseHead } from "$fresh/runtime.ts";

export default function Head() {
  return (
    <BaseHead>
      <title>Paleon</title>
      <link
        rel="stylesheet"
        href="https://esm.sh/simpledotcss@v2.2.1/simple.min.css"
      />
    </BaseHead>
  );
}

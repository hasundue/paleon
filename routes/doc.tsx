import { Handlers, PageProps } from "$fresh/server.ts";
import Head from "../components/Head.tsx";
import Header from "../components/Header.tsx";
import Highlight from "https://esm.sh/react-highlight@0.15.0";

type DocData = {
  handler: string;
};

export const handler: Handlers = {
  async GET(_, ctx) {
    const src = await Deno.readTextFile("./static/examples/handler.ts");
    return ctx.render({ handler: src });
  },
};

export default function Doc(props: PageProps<DocData>) {
  const src = props.data;

  return (
    <>
      <Head />
      <body>
        <Header current="Doc" />
        <div>
          <h2>📚 Doc</h2>
          <h3>
            App @ <code>paleon.deno.dev</code>
          </h3>
          <h4>
            Handler for <code>std/log</code>
          </h4>
          <Highlight>
            {src.handler}
          </Highlight>
        </div>
      </body>
    </>
  );
}

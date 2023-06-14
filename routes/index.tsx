import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { Log } from "../mod.ts";
import LogView from "../islands/LogView.tsx";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const log = await Log.open<string>([
      "paleon",
      Deno.env.get("DEPLOYMENT_ID") ?? "dev",
    ]);
    await log.write("Visited", { time: Date.now() });
    return ctx.render();
  },
};

export default function Home() {
  const id = Deno.env.get("DEPLOYMENT_ID") ?? "dev";

  return (
    <>
      <Head>
        <title>Paleon</title>
        <link
          rel="stylesheet"
          href="https://esm.sh/simpledotcss@v2.2.0/simple.min.css"
        />
      </Head>
      <body>
        <header>
          <h1>Paleon</h1>
          <p>A demo app that stores application logs in Deno KV.</p>
        </header>
        <div>
          <h3>Live logs</h3>
          <LogView project="paleon" id={id} />
        </div>
      </body>
    </>
  );
}

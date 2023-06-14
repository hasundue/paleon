import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { Log } from "../mod.ts";
import Records from "../islands/Records.tsx";

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
  return (
    <>
      <Head>
        <title>Paleon</title>
      </Head>
      <div>
        <h1>Paleon</h1>
        <p>
          A demo app that stores application logs in Deno KV.
        </p>
        <h2>Logs</h2>
        <Records project="paleon" id="dev" />
      </div>
    </>
  );
}

import { Handlers } from "$fresh/server.ts";
import { Log } from "/mod.ts";
import Head from "/components/Head.tsx";
import Header from "/components/Header.tsx";

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
      <Head />
      <body>
        <Header current="Home" />
      </body>
    </>
  );
}

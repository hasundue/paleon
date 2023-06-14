#!/usr/bin/env -S deno run -A --watch=static/,routes/

// import { Log } from "./lib/kvlog/mod.ts";
// await (await Log.open<string>(["paleon", "dev"])).erase();

import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts");

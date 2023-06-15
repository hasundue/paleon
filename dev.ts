#!/usr/bin/env -S deno run -A --watch=static/,routes/

import { PaleonStorage } from "./mod.ts";
await (await PaleonStorage.open(["paleon", "dev"])).erase();

import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts");

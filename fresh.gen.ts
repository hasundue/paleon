// DO NOT EDIT. This file is generated by fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import config from "./deno.json" assert { type: "json" };
import * as $0 from "./routes/[name].tsx";
import * as $1 from "./routes/[project]/[id].tsx";
import * as $2 from "./routes/api/records.ts";
import * as $3 from "./routes/index.tsx";
import * as $$0 from "./islands/Records.tsx";

const manifest = {
  routes: {
    "./routes/[name].tsx": $0,
    "./routes/[project]/[id].tsx": $1,
    "./routes/api/records.ts": $2,
    "./routes/index.tsx": $3,
  },
  islands: {
    "./islands/Records.tsx": $$0,
  },
  baseUrl: import.meta.url,
  config,
};

export default manifest;

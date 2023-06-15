# 🦕 Paleon

Logging service and module with Deno KV.

## Features

- Time-series data storage built upon Deno KV
- Realtime log streaming with SSE and BroadcastChannel

## Usage

### Paleon App @`paleon.deno.dev`

You can start persisting logs with the hosted Paleon App immediately!

> **Warning**: No access control is implemented yet. Do not use it for sensitive
> data.

#### Push logs with a custom handler for `std/log`

```ts
import * as log from "https://deno.land/std/log/mod.ts";
import { PaleonAppHandler } from "https://pax.deno.dev/hasundue/paleon/client.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
    paleon: new PaleonAppHandler("DEBUG", { project: "my-project" }),
  },

  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console", "paleon"],
    },
  },
});

const logger = getLogger();

logger.info("Hello Paleon!");
```

#### See logs on Web

Access `https://paleon.deno.dev/my-project/{DENO_DEPLOYMENT_ID}` to see your
logs.

#### Retrieve logs with SDK

```ts
import { PaleonClient } from "https://pax.deno.dev/hasundue/paleon/client.ts";

const paleon = new PaleonClient({ project: "my-project" });

// Get recorded logs
const logs = await paleon.read({ limit: 10 });
console.log(logs);

// Stream logs
const stream = paleon.listen();
for await (const record of stream) {
  console.log(record);
}
```

### Deno module for PaleonStorage

Or you may store any time-series data on your own instance of Deno KV.

```ts
import { PaleonStorage } from "https://pax.deno.dev/hasundue/paleon/mod.ts";

type TestLogRecord = {
  msg: string;
  datetime: Date;
};

paleon = await PaleonStorage.open<TestLogRecord>("my-app");

await paleon.write({ datetime: new Date(), msg: "hello" });

for await (const record of paleon.read()) {
  console.log(record);
}
```

# 🦕 Paleon

A proof-of-concept for a time-series storage and monitoring service, constructed
using Deno KV.

> **Note**: This project is developed for the
> [Deno KV Hackathon](https://github.com/denoland/deno-kv-hackathon) and not
> supposed to be used in practical usecases.

## Features

- Time-series data storage built upon Deno KV
- Realtime log streaming with SSE and BroadcastChannel

## Usage

### Paleon SaaS @`paleon.deno.dev`

You can start persisting logs with the hosted Paleon SaaS immediately!

> **Warning**: No access control is implemented. Do not use it for sensitive
> data.

#### Push logs with a custom handler for `std/log`

```ts
import * as log from "https://deno.land/std/log/mod.ts";
import { PaleonAppHandler } from "https://pax.deno.dev/hasundue/paleon/client.ts";

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG"),
    paleon: new PaleonAppHandler("DEBUG", {
      project: "{PROJECT_NAME}",
      id: "{DEPLOYMENT_ID}",
    }),
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

Access `https://paleon.deno.dev/{PROJECT_NAME}/{DEPLOYMENT_ID}` to see your
logs.

#### Retrieve logs with the client module

```ts
import { PaleonClient } from "https://pax.deno.dev/hasundue/paleon/client.ts";

const paleon = new PaleonClient({
  project: "{PROJECT_NAME}",
  id: "{DEPLOYMENT_ID}",
});

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

const paleon = await PaleonStorage.open<TestLogRecord>("my-app");

await paleon.write({ datetime: new Date(), msg: "hello" });

for await (const record of paleon.read()) {
  console.log(record);
}
```

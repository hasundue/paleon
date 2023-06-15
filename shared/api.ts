import { type LogRecord } from "$std/log/mod.ts";

export type RecordItem = {
  body: string;
  timestamp: string;
}

export type AppLogRecord = LogRecord & {
  readonly args: AppLogRecordArgs;
}

export type AppLogRecordArgs = [
  path: string,
  method: string,
  status: number,
];

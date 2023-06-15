import { type LogRecord } from "$std/log/mod.ts";
import { format } from "$std/datetime/format.ts";
import { LogLevels } from "$std/log/levels.ts";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = typeof LOG_LEVELS[number];

const { DEBUG, INFO, WARNING, ERROR } = LogLevels;

export const LogLevelMap = {
  debug: DEBUG,
  info: INFO,
  warn: WARNING,
  error: ERROR,
} as const;

export const LOG_PERIODS = ["hour", "day", "week", "month"] as const;
export type LogPeriod = typeof LOG_PERIODS[number];

export interface LogViewOptions {
  region: string;
  period: LogPeriod;
  level: LogLevel;
  reverse: boolean;
}

export interface LogViewProps {
  init: PaleonAppRecordItem[];
  project: string;
  id: string;
  options: LogViewOptions;
}

export type PaleonAppPayload = Omit<LogRecord, "datetime"> & {
  region: string;
  datetime: number;
};

export const PaleonAppPayload = {
  from(record: LogRecord): PaleonAppPayload {
    return {
      ...record,
      args: record.args,
      region: Deno.env.get("DENO_REGION") ?? "local",
      datetime: record.datetime.getTime(),
    };
  },
};

export type PaleonAppRecord = Omit<LogRecord, "#args" | "datetime"> & {
  args: unknown[];
  datetime: Date;
  region: string;
};

export const PaleonAppRecord = {
  from(payload: PaleonAppPayload): PaleonAppRecord {
    return {
      ...payload,
      datetime: new Date(payload.datetime),
    };
  },
};

export type PaleonAppRecordItem = {
  msg: string;
  datetime: string;
  region: string;
};

export const PaleonAppRecordItem = {
  from(record: PaleonAppRecord): PaleonAppRecordItem {
    return {
      ...record,
      datetime: format(new Date(record.datetime), "yyyy-MM-dd HH:mm:ss"),
    };
  },
};

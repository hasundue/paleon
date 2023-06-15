import { PaleonPayload } from "../mod.ts";
import { format } from "$std/datetime/format.ts";

export type AppLogRecord = {
  msg: string;
  datetime: Date;
  args?: unknown[];
};

export const AppLogRecord = {
  from(payload: PaleonPayload): AppLogRecord {
    return {
      msg: ("msg" in payload) ? payload.msg as string : "",
      datetime: new Date(payload.datetime),
      args: ("args" in payload) ? payload.args as unknown[] : undefined,
    };
  },
};

export type AppLogRecordItem = {
  msg: string;
  datetime: string;
};

export const AppLogRecordItem = {
  from(record: AppLogRecord): AppLogRecordItem {
    return {
      msg: record.msg,
      datetime: format(new Date(record.datetime), "yyyy-MM-dd HH:mm:ss"),
    };
  },
};

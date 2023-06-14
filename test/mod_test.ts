import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.191.0/testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.191.0/testing/bdd.ts";
import { collect } from "https://deno.land/x/streamtools@v0.5.0/mod.ts";
import { Log } from "../mod.ts";

describe("Log", () => {
  let log: Log<string>;

  beforeAll(async () => {
    log = await Log.open("test");
    await log.erase();
  });

  afterAll(() => {
    log.close();
  });

  it("should open a log", () => {
    assert(log);
  });

  it("should write a record", async () => {
    await log.write("hello");
  });

  it("should read a record", async () => {
    const records = await collect(log.read());
    assertEquals(records.length, 1);
    assertEquals(records[0].body, "hello");
  });

  it("should write records with a timestamp", async () => {
    await log.write("hello", { time: 0 });
    await log.write("hello", { time: 1 });
  });

  it("should read records with a time range", async () => {
    const records = await collect(
      log.read({ since: new Date(0), until: new Date(1) }),
    );
    assertEquals(records.length, 1);
  });

  it("should read multiple records", async () => {
    const records = await collect(log.read());
    assertEquals(records.length, 3);
  });

  it("should erase a log", async () => {
    await log.erase();
    const records = await collect(log.read());
    assertEquals(records.length, 0);
  });
});

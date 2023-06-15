import { assert, assertEquals } from "$std/testing/asserts.ts";
import { afterAll, beforeAll, describe, it } from "$std/testing/bdd.ts";
import { collect } from "$streamtools/mod.ts";
import { PaleonStorage } from "../mod.ts";

type TestLogRecord = {
  msg: string;
  datetime: Date;
};

describe("PaleonStorage", () => {
  let paleon: PaleonStorage<TestLogRecord>;

  beforeAll(async () => {
    paleon = await PaleonStorage.open<{ datetime: Date; msg: string }>(
      "mod_test",
    );
    await paleon.erase();
  });

  afterAll(() => {
    paleon.close();
  });

  it("should open a log", () => {
    assert(paleon);
  });

  it("should write a record", async () => {
    await paleon.write({ datetime: new Date(), msg: "hello" });
  });

  it("should read a record", async () => {
    const records = await collect(paleon.read());
    assertEquals(records.length, 1);
    assertEquals(records[0].msg, "hello");
  });

  it("should read records with a time range", async () => {
    await paleon.write({ datetime: new Date(1), msg: "1" });
    await paleon.write({ datetime: new Date(2), msg: "2" });
    const records = await collect(
      paleon.read({ since: new Date(0), until: new Date(3) }),
    );
    assertEquals(records.length, 2);
  });

  it("should read all records", async () => {
    const records = await collect(paleon.read());
    assertEquals(records.length, 3);
  });

  it("should erase a log", async () => {
    await paleon.erase();
    const records = await collect(paleon.read());
    assertEquals(records.length, 0);
  });
});

import { expect, test } from "bun:test";
import { applyHeaders, normalizeHeaders, readTabHeaders } from "./headers";

test("replaces all case-insensitive matches, adds missing headers, and preserves unrelated binary headers", () => {
  const binaryValue = new Uint8Array([1, 2]).buffer;
  const original = [
    { name: "X-Debug", value: "old" },
    { name: "x-debug", value: "duplicate" },
    { name: "Accept", value: "text/html" },
    { name: "X-Binary", binaryValue },
  ];
  expect(
    applyHeaders(original, [
      { name: "X-DEBUG", value: "new" },
      { name: "Authorization", value: "Bearer example" },
    ]),
  ).toEqual([
    { name: "Accept", value: "text/html" },
    { name: "X-Binary", binaryValue },
    { name: "X-DEBUG", value: "new" },
    { name: "Authorization", value: "Bearer example" },
  ]);
  expect(original[0]?.value).toBe("old");
});

test("accepts token names and empty values, ignores empty rows, and preserves value whitespace", () => {
  expect(
    normalizeHeaders([
      { name: "", value: "" },
      { name: " X-Empty ", value: "" },
      { name: "X-Value", value: " a:b\tc " },
    ]),
  ).toEqual([
    { name: "X-Empty", value: "" },
    { name: "X-Value", value: " a:b\tc " },
  ]);
});

test("rejects malformed names, duplicate names, and header injection", () => {
  for (const name of ["", "Bad Name", "X:Name", "X\r\nInjected", "Ünicode"]) {
    expect(() => normalizeHeaders([{ name, value: "test" }])).toThrow(
      "valid header name",
    );
  }
  expect(() =>
    normalizeHeaders([
      { name: "X-Test", value: "a" },
      { name: "x-test", value: "b" },
    ]),
  ).toThrow("already listed");
  for (const value of ["\r\nX-Injected: true", "a\nb", "\0", "\x7f", "😀"]) {
    expect(() => normalizeHeaders([{ name: "X-Test", value }])).toThrow(
      "values cannot contain",
    );
  }
});

test("malformed stored settings leave requests untouched", () => {
  for (const value of [
    null,
    {},
    { enabled: "yes", headers: [] },
    { enabled: true, headers: [null] },
    { enabled: true, headers: [{ name: "Bad Name", value: "test" }] },
  ]) {
    expect(readTabHeaders(value)).toEqual({ enabled: false, headers: [] });
  }
});

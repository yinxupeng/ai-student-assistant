import test from "node:test";
import assert from "node:assert/strict";
import { archiveEnumValues, archiveDateIntervals, hasArchiveFilter, matchesArchiveFilter, compareArchiveRows } from "./archiveQuery.js";

test("multi-country selections match any value and preserve numeric zero", () => {
  assert.deepEqual(archiveEnumValues("英国,香港", "targetCountry"), ["英国", "香港"]);
  assert.equal(matchesArchiveFilter("英国,香港", "targetCountry", { values: ["香港", "美国"] }), true);
  assert.equal(matchesArchiveFilter("英国", "targetCountry", { values: ["香港"] }), false);
  assert.equal(matchesArchiveFilter(0, "unarrangedHours", { presence: "filled", min: 0, max: 0 }), true);
  assert.equal(matchesArchiveFilter(undefined, "unarrangedHours", { min: 0 }), false);
  assert.equal(hasArchiveFilter({ min: 0 }), true);
});

test("presence and keywords compose without searching missing values", () => {
  assert.equal(matchesArchiveFilter("未填写", "riskNotes", { presence: "empty" }), true);
  assert.equal(matchesArchiveFilter("   ", "riskNotes", { presence: "filled" }), false);
  assert.equal(matchesArchiveFilter("等待 UCL 结果", "riskNotes", { presence: "filled", keyword: "ucl" }), true);
  assert.equal(matchesArchiveFilter("等待 UCL 结果", "riskNotes", { presence: "empty", keyword: "ucl" }), false);
});

test("date ranges preserve month precision and match any regional deadline", () => {
  assert.equal(matchesArchiveFilter("香港 2027.10 / 英国 2028.7.30", "languageDeadline", { start: "2028-07-30", end: "2028-07-30" }), true);
  assert.equal(matchesArchiveFilter("2028.10", "languageDeadline", { start: "2028-10-15", end: "2028-10-16" }), true);
  assert.equal(matchesArchiveFilter("2028.10", "languageDeadline", { end: "2028-09-30" }), false);
  assert.equal(matchesArchiveFilter(undefined, "languageDeadline", { start: "2028-01-01" }), false);
  assert.equal(archiveDateIntervals("2027.2.30 / 2028.13").length, 0);
});

test("numeric and date sorting keep missing values last in both directions", () => {
  const rows = [{ unarrangedHours: undefined }, { unarrangedHours: 12 }, { unarrangedHours: 0 }];
  assert.deepEqual([...rows].sort((a, b) => compareArchiveRows(a, b, "unarrangedHours", "ascend")).map((row) => row.unarrangedHours), [0, 12, undefined]);
  assert.deepEqual([...rows].sort((a, b) => compareArchiveRows(a, b, "unarrangedHours", "descend")).map((row) => row.unarrangedHours), [12, 0, undefined]);
  const dates = [{ languageDeadline: "未确认" }, { languageDeadline: "2028.10" }, { languageDeadline: "香港 2027.10 / 英国 2028.7.30" }];
  assert.equal([...dates].sort((a, b) => compareArchiveRows(a, b, "languageDeadline", "descend"))[2].languageDeadline, "未确认");
});

test("grades sort by school progression rather than character order", () => {
  const rows = ["已毕业", "高一", "初三", "11", "高三"].map((currentGrade) => ({ currentGrade }));
  assert.deepEqual(rows.sort((a, b) => compareArchiveRows(a, b, "currentGrade", "ascend")).map((row) => row.currentGrade), ["初三", "高一", "11", "高三", "已毕业"]);
});

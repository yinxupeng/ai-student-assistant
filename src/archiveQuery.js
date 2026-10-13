const enumFields = new Set(["gender", "school", "currentGrade", "graduationYear", "system", "homeroomTeacher", "advisor", "planningAdvisor", "enrolledSubject", "enrolledLanguage", "hasPlanning", "targetCountry"]);
const dateFields = new Set(["serviceStartDate", "languageDeadline"]);
const nameFields = new Set(["studentName", "school", "homeroomTeacher", "advisor", "planningAdvisor"]);

export function archiveFilterType(key) {
  return enumFields.has(key) ? "enum" : dateFields.has(key) ? "date" : key === "unarrangedHours" ? "number" : "text";
}

export function isArchiveSortable(key) {
  return nameFields.has(key) || dateFields.has(key) || ["currentGrade", "graduationYear", "unarrangedHours"].includes(key);
}

export function isArchiveEmpty(value) {
  return value == null || String(value).trim() === "" || String(value).trim() === "未填写";
}

export function archiveEnumValues(value, key) {
  if (isArchiveEmpty(value)) return [];
  return key === "targetCountry" ? String(value).split(/[,，、/；;]+/).map((part) => part.trim()).filter(Boolean) : [String(value).trim()];
}

// Month-only deadlines represent the full month, not an invented exact day.
export function archiveDateIntervals(value) {
  const matches = String(value || "").matchAll(/(\d{4})[.\-/年](\d{1,2})(?:[.\-/月](\d{1,2}))?/g);
  return Array.from(matches).flatMap((match) => {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = match[3] ? Number(match[3]) : null;
    if (month < 1 || month > 12) return [];
    const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day !== null && (day < 1 || day > maxDay)) return [];
    return [{ start: Date.UTC(year, month - 1, day || 1), end: Date.UTC(year, month - 1, day || maxDay) }];
  });
}

export function hasArchiveFilter(filter = {}) {
  return Boolean(filter.presence || filter.keyword?.trim() || filter.values?.length || filter.min != null || filter.max != null || filter.start || filter.end);
}

export function matchesArchiveFilter(value, key, filter = {}) {
  const empty = isArchiveEmpty(value);
  if (filter.presence === "filled" && empty) return false;
  if (filter.presence === "empty" && !empty) return false;
  if (filter.keyword?.trim() && !String(value ?? "").toLocaleLowerCase().includes(filter.keyword.trim().toLocaleLowerCase())) return false;
  if (filter.values?.length && !archiveEnumValues(value, key).some((part) => filter.values.includes(part))) return false;
  if (filter.min != null || filter.max != null) {
    const number = empty ? NaN : Number(value);
    if (!Number.isFinite(number) || (filter.min != null && number < filter.min) || (filter.max != null && number > filter.max)) return false;
  }
  if (filter.start || filter.end) {
    const start = filter.start ? Date.parse(`${filter.start}T00:00:00Z`) : -Infinity;
    const end = filter.end ? Date.parse(`${filter.end}T00:00:00Z`) : Infinity;
    if (!archiveDateIntervals(value).some((interval) => interval.end >= start && interval.start <= end)) return false;
  }
  return true;
}

function gradeRank(value) {
  const ranks = { 初一: 7, 初二: 8, 初三: 9, 高一: 10, 高二: 11, 高三: 12, 已毕业: 100 };
  return ranks[value] ?? (/^\d+$/.test(String(value)) ? Number(value) : null);
}

export function compareArchiveRows(a, b, key, order) {
  let left = a[key];
  let right = b[key];
  if (dateFields.has(key)) {
    left = Math.min(...archiveDateIntervals(left).map((date) => date.start));
    right = Math.min(...archiveDateIntervals(right).map((date) => date.start));
    if (!Number.isFinite(left)) left = null;
    if (!Number.isFinite(right)) right = null;
  } else if (["unarrangedHours", "graduationYear"].includes(key)) {
    left = isArchiveEmpty(left) || !Number.isFinite(Number(left)) ? null : Number(left);
    right = isArchiveEmpty(right) || !Number.isFinite(Number(right)) ? null : Number(right);
  } else if (key === "currentGrade") {
    left = gradeRank(left);
    right = gradeRank(right);
  }
  if (isArchiveEmpty(left)) return isArchiveEmpty(right) ? 0 : 1;
  if (isArchiveEmpty(right)) return -1;
  const compared = typeof left === "number" ? left - right : String(left).localeCompare(String(right), "zh-Hans-CN", { numeric: true });
  return order === "descend" ? -compared : compared;
}

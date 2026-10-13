export function getServicePlanItems(entry = {}, legacyId = "legacy") {
  if (Array.isArray(entry.items)) {
    return entry.items.filter((item) => item && typeof item.id === "string" && typeof item.text === "string");
  }
  return typeof entry.plan === "string" && entry.plan ? [{ id: legacyId, text: entry.plan }] : [];
}

export function serializeServicePlanItems(items) {
  return items.map((item) => ({ id: item.id, text: item.text.trim() }));
}

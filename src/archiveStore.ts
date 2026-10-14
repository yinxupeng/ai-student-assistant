import { reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { JSONContent } from '@tiptap/vue-3';
import type { ArchiveField, ArchiveNotes, ArchiveRow } from './archiveTypes';
import { standardArchiveFields, standardArchiveRows, defaultArchiveFieldKeys, requiredArchiveFieldKeys } from './archiveData';

export const storageKeys = { fields: 'studentArchive.customFields.v1', visible: 'studentArchive.visibleFields.v1', order: 'studentArchive.visibleFields.v1.order', notes: 'studentArchive.notes.v1', plans: 'student-service-plans-v1' };
export function readStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
export function writeStorage(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { ElMessage.error('保存失败，当前内容已保留，请检查浏览器存储后重试'); return false; }
}
const loadedFields = readStorage<ArchiveField[]>(storageKeys.fields, []);
const names = new Set(standardArchiveFields.map(field => field.title));
const customFields = (Array.isArray(loadedFields) ? loadedFields : []).filter(field => {
  if (!field || typeof field.key !== 'string' || !field.key.startsWith('custom_') || typeof field.title !== 'string' || !field.title.trim() || names.has(field.title.trim())) return false;
  names.add(field.title.trim()); return true;
}).slice(0, 5).map(field => ({ ...field, custom: true, width: 200 }));
const allKeys = [...standardArchiveFields, ...customFields].map(field => field.key);
const savedVisible = readStorage<string[]>(storageKeys.visible, []);
const validVisible = Array.isArray(savedVisible) ? savedVisible.filter(key => allKeys.includes(key)) : [];
const loadedNotes = readStorage<ArchiveNotes>(storageKeys.notes, {});
export const archive = reactive({
  customFields,
  visibleKeys: [...new Set([...requiredArchiveFieldKeys, ...(validVisible.length ? validVisible : [...defaultArchiveFieldKeys, ...customFields.map(field => field.key)])])],
  notes: loadedNotes && typeof loadedNotes === 'object' && !Array.isArray(loadedNotes) ? loadedNotes : {},
});
export const fields = computed<ArchiveField[]>(() => [...standardArchiveFields, ...archive.customFields]);
export const rows = computed<ArchiveRow[]>(() => standardArchiveRows.map(row => {
  const updates = archive.notes[row.id] || {};
  return { ...row, ...Object.fromEntries(fields.value.filter(field => typeof updates[field.key] === 'string').map(field => [field.key, updates[field.key]])) } as ArchiveRow;
}));
export const editableKeys = new Set(['riskNotes', 'latestFollowUp', 'targetSchool', 'targetMajor', 'courseSelection', 'subjectTargetScore', 'subjectCurrentStatus']);
export const richKeys = new Set(['riskNotes', 'latestFollowUp']);
export const confirmationKeys = new Set(['targetMajor', 'courseSelection']);
export function saveNote(id: string, key: string, text: string, document?: JSONContent): boolean {
  const latest = readStorage<ArchiveNotes>(storageKeys.notes, archive.notes);
  const next = { ...latest, [id]: { ...latest[id], [key]: text, ...(document ? { [`${key}Document`]: document } : {}) } };
  if (!writeStorage(storageKeys.notes, next)) return false;
  archive.notes = next;
  ElMessage.success('已保存');
  return true;
}
export function saveConfiguration(custom: ArchiveField[], selected: string[], order: string[]): boolean {
  const nextKeys = [...new Set([...requiredArchiveFieldKeys, ...order.filter(key => selected.includes(key))])];
  const changes = { [storageKeys.fields]: custom, [storageKeys.visible]: nextKeys, [storageKeys.order]: order };
  const previous = Object.fromEntries(Object.keys(changes).map(key => [key, localStorage.getItem(key)]));
  try { for (const [key, value] of Object.entries(changes)) localStorage.setItem(key, JSON.stringify(value)); }
  catch {
    for (const [key, value] of Object.entries(previous)) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* Keep in-memory draft available. */ } }
    ElMessage.error('字段配置保存失败，请重试'); return false;
  }
  archive.customFields = custom.map(field => ({ ...field, custom: true, width: 200 }));
  archive.visibleKeys = nextKeys;
  ElMessage.success('字段配置已保存'); return true;
}
export function openStudentDemo(): void {
  location.assign(`./${encodeURIComponent('客户视角&内部版demo展示V1007')}/${encodeURIComponent('02-已签约客户-直观版.html')}`);
}

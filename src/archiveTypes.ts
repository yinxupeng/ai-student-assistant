import type { JSONContent } from '@tiptap/vue-3';

export interface ArchiveField {
  key: string;
  title: string;
  group?: string;
  required?: boolean;
  defaultVisible?: boolean;
  custom?: boolean;
  width?: number;
  searchable?: boolean;
  filterable?: boolean;
  sorter?: boolean;
  sourceFields?: string[];
}
export interface ArchiveRow {
  id: string;
  studentName: string;
  source: string;
  linkedUserId: string;
  [key: string]: string | number | undefined;
}
export interface ColumnFilter {
  presence?: '' | 'filled' | 'empty';
  values?: string[];
  keyword?: string;
  min?: number | null;
  max?: number | null;
  start?: string;
  end?: string;
}
export interface PlanItem { id: string; text: string }
export interface PlanEntry { items?: PlanItem[]; plan?: string; record?: string; updatedAt?: string }
export type PlanData = Record<string, Record<string, PlanEntry>>;
export type ArchiveNotes = Record<string, Record<string, string | JSONContent>>;

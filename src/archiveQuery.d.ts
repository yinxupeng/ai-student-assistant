import type { ArchiveRow, ColumnFilter } from './archiveTypes';
export function archiveFilterType(key: string): 'enum' | 'date' | 'number' | 'text';
export function isArchiveSortable(key: string): boolean;
export function isArchiveEmpty(value: unknown): boolean;
export function archiveEnumValues(value: unknown, key: string): string[];
export function archiveDateIntervals(value: unknown): {start: number; end: number}[];
export function hasArchiveFilter(filter?: ColumnFilter): boolean;
export function matchesArchiveFilter(value: unknown, key: string, filter?: ColumnFilter): boolean;
export function compareArchiveRows(a: ArchiveRow, b: ArchiveRow, key: string, order: string): number;

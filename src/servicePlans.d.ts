import type { PlanEntry, PlanItem } from './archiveTypes';
export function getServicePlanItems(entry?: PlanEntry, legacyId?: string): PlanItem[];
export function serializeServicePlanItems(items: PlanItem[]): PlanItem[];
export function getSampleServicePlanEntry(studentId: string, year: number, month: number): PlanEntry;

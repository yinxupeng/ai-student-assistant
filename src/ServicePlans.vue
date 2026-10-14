<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { ArrowLeft, ArrowRight, Plus, Grid, Operation } from '@element-plus/icons-vue';
import CellEditor from './CellEditor.vue';
import type { ArchiveRow, PlanData, PlanEntry, PlanItem } from './archiveTypes';
import { readStorage, writeStorage, storageKeys } from './archiveStore';
import { getServicePlanItems, serializeServicePlanItems, getSampleServicePlanEntry } from './servicePlans.js';
const props = defineProps<{ modelValue: boolean; student: ArchiveRow | null }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const year = ref(new Date().getFullYear());
const view = ref('grid');
const saved = ref<PlanData>({});
const drafts = ref<Record<number, PlanItem[]>>({});
const months = Array.from({ length: 12 }, (_, i) => i + 1);
watch(() => props.modelValue, (open) => { if (open) { saved.value = readStorage<PlanData>(storageKeys.plans, {}); drafts.value = {}; year.value = new Date().getFullYear(); } });
function entry(month: number): PlanEntry { return saved.value[props.student?.id || '']?.[`${year.value}-${month}`] || (year.value === new Date().getFullYear() ? getSampleServicePlanEntry(props.student?.id || '', year.value, month) : {}); }
function storedItems(month: number): PlanItem[] { return getServicePlanItems(entry(month), `${props.student?.id}-${year.value}-${month}-legacy`); }
function items(month: number): PlanItem[] { return drafts.value[month] || storedItems(month); }
const changed = computed(() => months.filter(month => drafts.value[month] && JSON.stringify(drafts.value[month]) !== JSON.stringify(storedItems(month))));
const populated = computed(() => months.filter(month => items(month).some(item => item.text.trim())).length);
const total = computed(() => months.reduce((sum, month) => sum + items(month).length, 0));
const timelineRows = computed(() => [...Array.from({ length: Math.max(1, ...months.map(month => items(month).length)) }, (_, index) => ({ index })), { index: -1 }]);
function add(month: number) { drafts.value[month] = [...items(month), { id: crypto.randomUUID(), text: '' }]; }
function edit(month: number, id: string, text: string): boolean { drafts.value[month] = items(month).map(item => item.id === id ? { ...item, text } : item); return true; }
function remove(month: number, id: string) { drafts.value[month] = items(month).filter(item => item.id !== id); }
async function leave(action: () => void) {
  if (changed.value.length) {
    try { await ElMessageBox.confirm('离开后将放弃这些修改。', '服务计划有未保存的修改', { confirmButtonText: '放弃修改', cancelButtonText: '继续编辑', type: 'warning' }); }
    catch { return; }
  }
  action();
}
function selectYear(value: number | undefined) { if (!value || value < 2000 || value > 2100 || value === year.value) return; void leave(() => { year.value = value; drafts.value = {}; }); }
function close(done?: () => void) { void leave(() => { if (done) done(); else emit('update:modelValue', false); }); }
function save() {
  if (!props.student) return;
  const latest = readStorage<PlanData>(storageKeys.plans, saved.value);
  const next = { ...latest, [props.student.id]: { ...latest[props.student.id] } };
  for (const month of changed.value) next[props.student.id][`${year.value}-${month}`] = { ...entry(month), items: serializeServicePlanItems(drafts.value[month]), updatedAt: new Date().toISOString() };
  if (!writeStorage(storageKeys.plans, next)) return;
  saved.value = next; drafts.value = {}; ElMessage.success('服务计划已保存');
}
function isCurrent(month: number) { return year.value === new Date().getFullYear() && month === new Date().getMonth() + 1; }
</script>
<template>
  <el-drawer :model-value="modelValue" :title="`${student?.studentName || ''} · 服务计划`" :size="view === 'timeline' ? '1120px' : '840px'" :before-close="close" class="plan-drawer" @update:model-value="emit('update:modelValue', $event)">
    <div class="plan-toolbar"><div class="year-selector"><el-button :icon="ArrowLeft" :disabled="year <= 2000" aria-label="上一年" @click="selectYear(year - 1)" /><el-input-number :model-value="year" :controls="false" :min="2000" :max="2100" :precision="0" aria-label="计划年份" @change="selectYear" /><span>年</span><el-button :icon="ArrowRight" :disabled="year >= 2100" aria-label="下一年" @click="selectYear(year + 1)" /></div>
      <el-radio-group v-model="view" aria-label="服务计划展示方式"><el-radio-button value="grid"><el-icon><Grid /></el-icon> 宫格</el-radio-button><el-radio-button value="timeline"><el-icon><Operation /></el-icon> 时间轴</el-radio-button></el-radio-group>
    </div>
    <p class="plan-summary muted">已记录 {{ populated }}/12 个月 · 共 {{ total }} 条计划</p>
    <div v-if="view === 'grid'" class="month-grid">
      <section v-for="month in months" :key="month" class="month-cell" :aria-label="`${year}年${month}月服务计划`">
        <header class="month-heading"><strong>{{ month }}月</strong><el-tag v-if="isCurrent(month)" size="small">本月</el-tag><span v-if="changed.includes(month)" class="draft-indicator">未保存</span></header>
        <div class="month-plans"><div v-for="(item, index) in items(month)" :key="item.id" class="plan-item"><span class="plan-item-label">计划 {{ index + 1 }}</span><CellEditor :value="item.text" :label="`${month}月计划${index + 1}`" :save="text => edit(month, item.id, text)" removable @remove="remove(month, item.id)" /></div></div>
        <el-button class="add-plan" text size="small" :icon="Plus" @click="add(month)">新增计划</el-button>
      </section>
    </div>
    <el-table v-else :data="timelineRows" border :max-height="'65vh'" class="plan-timeline" row-key="index">
      <el-table-column label="计划" width="64" fixed><template #default="{ row }">{{ row.index >= 0 ? row.index + 1 : '' }}</template></el-table-column>
      <el-table-column v-for="month in months" :key="month" :width="220">
        <template #header><div class="month-heading"><strong>{{ month }}月</strong><el-tag v-if="isCurrent(month)" size="small">本月</el-tag><span v-if="changed.includes(month)" class="draft-indicator">未保存</span></div></template>
        <template #default="{ row }"><el-button v-if="row.index === -1" text size="small" :icon="Plus" @click="add(month)">新增计划</el-button><div v-else-if="items(month)[row.index]" class="plan-item"><span class="plan-item-label">计划 {{ row.index + 1 }}</span><CellEditor :key="items(month)[row.index].id" :value="items(month)[row.index].text" :label="`${month}月计划${row.index + 1}`" :save="text => edit(month, items(month)[row.index].id, text)" removable @remove="remove(month, items(month)[row.index].id)" /></div></template>
      </el-table-column>
    </el-table>
    <template #footer><span v-if="changed.length" class="footer-draft muted">{{ changed.length }}个月待保存</span><el-button @click="close()">关闭</el-button><el-button type="primary" :disabled="!changed.length" @click="save">保存修改</el-button></template>
  </el-drawer>
</template>

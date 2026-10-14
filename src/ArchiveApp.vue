<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Setting, Search, RefreshLeft, Calendar, Fold, Expand, User, ChatDotRound } from '@element-plus/icons-vue';
import type { TableInstance } from 'element-plus';
import type { JSONContent } from '@tiptap/vue-3';
import type { ArchiveField, ArchiveRow, ColumnFilter } from './archiveTypes';
import { archive, fields, rows, saveNote, editableKeys, richKeys, confirmationKeys, openStudentDemo } from './archiveStore';
import { standardArchiveFields } from './archiveData';
import { archiveEnumValues, hasArchiveFilter, matchesArchiveFilter, compareArchiveRows, isArchiveSortable } from './archiveQuery.js';
import CellEditor from './CellEditor.vue';
import RichCell from './RichCell.vue';
import RemarkCell from './RemarkCell.vue';
import ColumnFilterPanel from './ColumnFilter.vue';
import FieldConfig from './FieldConfig.vue';
import ServicePlans from './ServicePlans.vue';
const collapsed = ref(false);
const narrow = ref(window.innerWidth <= 760);
const mobileQuery = window.matchMedia('(max-width: 760px)');
const updateNarrow = () => { narrow.value = mobileQuery.matches; };
onMounted(() => mobileQuery.addEventListener('change', updateNarrow));
onBeforeUnmount(() => mobileQuery.removeEventListener('change', updateNarrow));
const fieldConfigOpen = ref(false);
const planOpen = ref(false);
const planStudent = ref<ArchiveRow | null>(null);
const keyword = ref('');
const quick = reactive<Record<string, string>>({ source: '', targetCountry: '', system: '', product: '', hasPlanning: '', advisor: '', homeroomTeacher: '' });
const columnFilters = ref<Record<string, ColumnFilter>>({});
const sort = ref<{key: string; order: string} | null>(null);
const page = ref(1);
const pageSize = ref(8);
const table = ref<TableInstance>();
const quickFields = [{key: 'source', title: '来源'}, {key: 'targetCountry', title: '目标国家/地区'}, {key: 'system', title: '学生体系'}, {key: 'product', title: '产品'}, {key: 'hasPlanning', title: '报名规划'}, {key: 'advisor', title: '当前顾问'}, {key: 'homeroomTeacher', title: '当前班主任'}];
function quickOptions(key: string) { return key === 'product' ? ['报名学科', '报名语培', '报名规划'] : [...new Set(rows.value.flatMap(row => archiveEnumValues(row[key], key)))]; }
const visibleFields = computed(() => archive.visibleKeys.map(key => fields.value.find(field => field.key === key)).filter((field): field is ArchiveField => Boolean(field)));
const filtered = computed(() => {
  const search = keyword.value.trim().toLocaleLowerCase();
  const result = rows.value.filter(row => {
    if (search && !fields.value.some(field => String(row[field.key] ?? '').toLocaleLowerCase().includes(search))) return false;
    for (const [key, value] of Object.entries(quick)) {
      if (!value) continue;
      if (key === 'product') { const productField = ({ 报名学科: 'enrolledSubject', 报名语培: 'enrolledLanguage', 报名规划: 'hasPlanning' })[value]; if (!productField || !String(row[productField] || '').startsWith('是')) return false; }
      else if (!archiveEnumValues(row[key], key).includes(value)) return false;
    }
    return Object.entries(columnFilters.value).every(([key, filter]) => matchesArchiveFilter(row[key], key, filter));
  });
  if (sort.value) result.sort((a, b) => compareArchiveRows(a, b, sort.value!.key, sort.value!.order));
  return result;
});
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
watch([keyword, quick, columnFilters, pageSize], () => { page.value = 1; }, { deep: true });
watch(filtered, (value) => { if (page.value > Math.max(1, Math.ceil(value.length / pageSize.value))) page.value = 1; });
const activeFilters = computed(() => {
  const result: {id: string; text: string; remove: () => void}[] = [];
  if (keyword.value.trim()) result.push({id: 'keyword', text: `搜索：${keyword.value.trim()}`, remove: () => { keyword.value = ''; }});
  for (const field of quickFields) if (quick[field.key]) result.push({id: `quick-${field.key}`, text: `${field.title}：${quick[field.key]}`, remove: () => { quick[field.key] = ''; }});
  for (const [key, filter] of Object.entries(columnFilters.value)) {
    const title = fields.value.find(field => field.key === key)?.title || key;
    const detail = [filter.presence === 'filled' ? '已填写' : filter.presence === 'empty' ? '未填写' : '', filter.values?.join('、'), filter.keyword, filter.min != null || filter.max != null ? `${filter.min ?? '不限'}—${filter.max ?? '不限'}` : '', filter.start || filter.end ? `${filter.start || '不限'} 至 ${filter.end || '不限'}` : ''].filter(Boolean).join(' · ');
    result.push({id: key, text: `${title}：${detail}`, remove: () => setFilter(key, {})});
  }
  if (sort.value) result.push({id: 'sort', text: `${fields.value.find(field => field.key === sort.value?.key)?.title}：${sort.value.order === 'ascend' ? '升序' : '降序'}`, remove: clearSort});
  return result;
});
function setFilter(key: string, filter: ColumnFilter) { const next = {...columnFilters.value}; if (hasArchiveFilter(filter)) next[key] = filter; else delete next[key]; columnFilters.value = next; }
function onSort({ prop, order }: {prop: string; order: string | null}) { sort.value = order ? {key: prop, order: order === 'ascending' ? 'ascend' : 'descend'} : null; page.value = 1; }
function clearSort() { sort.value = null; table.value?.clearSort(); }
function reset() { keyword.value = ''; Object.keys(quick).forEach(key => { quick[key] = ''; }); columnFilters.value = {}; clearSort(); }
function documentFor(row: ArchiveRow, key: string) { const value = archive.notes[row.id]?.[`${key}Document`]; return value && typeof value === 'object' ? value as JSONContent : undefined; }
function remarkFor(row: ArchiveRow, key: string) { const value = archive.notes[row.id]?.[`${key}Remark`]; return typeof value === 'string' ? value : ''; }
function configurationSaved() { columnFilters.value = Object.fromEntries(Object.entries(columnFilters.value).filter(([key]) => fields.value.some(field => field.key === key))); }
function openPlans(row: ArchiveRow) { planStudent.value = row; planOpen.value = true; }
function askAgent() { location.assign('./legacy.html?view=agent'); }
</script>

<template>
  <el-container class="archive-layout">
    <el-aside class="archive-sidebar" :width="collapsed || narrow ? '64px' : '196px'">
      <div class="brand"><span class="brand-symbol">AI</span><strong v-if="!collapsed && !narrow">学情助手</strong></div>
      <el-menu default-active="students" :collapse="collapsed || narrow" :collapse-transition="false" class="archive-menu"><el-menu-item index="students"><el-icon><User /></el-icon><template #title>学生档案</template></el-menu-item></el-menu>
      <el-tooltip :content="collapsed ? '展开菜单' : '收起菜单'" placement="right"><el-button class="collapse-menu" text :icon="collapsed ? Expand : Fold" aria-label="切换菜单" @click="collapsed = !collapsed" /></el-tooltip>
    </el-aside>
    <el-container class="archive-main">
      <el-header class="archive-topbar"><span>学生档案</span><span class="topbar-count">{{ rows.length }} 位学生</span></el-header>
      <el-main class="archive-workspace">
        <header class="page-heading"><div><h1>学生档案</h1></div><div class="page-actions"><el-button :icon="ChatDotRound" type="primary" @click="askAgent">问学情Agent</el-button><el-button :icon="Setting" @click="fieldConfigOpen = true">字段配置</el-button></div></header>
        <section class="archive-query-area">
          <div class="quick-filters">
            <el-input v-model="keyword" class="archive-search" :prefix-icon="Search" placeholder="搜索学生、学校、负责人或跟进内容" clearable aria-label="搜索学生档案" />
            <el-select v-for="field in quickFields" :key="field.key" v-model="quick[field.key]" :placeholder="field.title" clearable filterable :aria-label="field.title"><el-option v-for="value in quickOptions(field.key)" :key="value" :label="value" :value="value" /></el-select>
            <el-button :icon="RefreshLeft" @click="reset">重置</el-button>
          </div>
          <div v-if="activeFilters.length" class="active-filters"><el-tag v-for="filter in activeFilters" :key="filter.id" closable type="info" effect="plain" @close="filter.remove">{{ filter.text }}</el-tag></div>
        </section>
        <div class="table-summary"><span>档案 <strong>{{ filtered.length }}</strong><span class="muted"> / {{ rows.length }} 条</span></span><span class="muted">标准字段 {{ standardArchiveFields.length }} 个<span v-if="archive.customFields.length"> · 自定义 {{ archive.customFields.length }} 个</span> · 当前展示 {{ archive.visibleKeys.length + 1 }} 列</span></div>
        <el-table ref="table" class="archive-table" :data="pageRows" border row-key="id" height="calc(100vh - 350px)" scrollbar-always-on empty-text="暂无符合条件的学生" @sort-change="onSort">
          <el-table-column v-for="field in visibleFields" :key="field.key" :prop="field.key" :label="field.title" :width="field.key === 'studentName' && narrow ? 140 : richKeys.has(field.key) ? 260 : Math.max(156, field.width || 180)" :fixed="field.key === 'studentName' ? 'left' : false" :sortable="isArchiveSortable(field.key) ? 'custom' : false">
            <template #header><span class="column-heading"><span>{{ field.title }}</span><ColumnFilterPanel :field="field" :rows="rows" :filter="columnFilters[field.key]" @apply="filter => setFilter(field.key, filter)" /></span></template>
            <template #default="{ row }">
              <RichCell v-if="richKeys.has(field.key)" :value="String(row[field.key] ?? '')" :document="documentFor(row, field.key)" :label="field.title" :save="(text, document) => saveNote(row.id, field.key, text, document)" />
              <CellEditor v-else-if="field.custom || editableKeys.has(field.key)" :value="String(row[field.key] ?? '')" :label="field.title" :confirm="confirmationKeys.has(field.key)" :save="text => saveNote(row.id, field.key, text)" />
              <RemarkCell v-else :value="String(row[field.key] ?? '')" :label="field.title" :student="row.studentName" :remark="remarkFor(row, field.key)" :save="text => saveNote(row.id, `${field.key}Remark`, text)" :navigate="field.key === 'studentName' ? openStudentDemo : undefined" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="132" :fixed="narrow ? false : 'right'"><template #default="{ row }"><el-button text type="primary" :icon="Calendar" @click="openPlans(row)">服务计划</el-button></template></el-table-column>
        </el-table>
        <div class="table-pagination"><span class="muted">共 {{ filtered.length }} 条</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[8, 20, 50]" :total="filtered.length" layout="sizes, prev, pager, next" background /></div>
      </el-main>
    </el-container>
    <FieldConfig v-model="fieldConfigOpen" @saved="configurationSaved" />
    <ServicePlans v-model="planOpen" :student="planStudent" />
  </el-container>
</template>

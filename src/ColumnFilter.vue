<script setup lang="ts">
import { ref, computed } from 'vue';
import { Filter } from '@element-plus/icons-vue';
import type { ArchiveField, ArchiveRow, ColumnFilter } from './archiveTypes';
import { archiveEnumValues, archiveFilterType, hasArchiveFilter } from './archiveQuery.js';
const props = defineProps<{ field: ArchiveField; rows: ArchiveRow[]; filter?: ColumnFilter }>();
const emit = defineEmits<{ apply: [filter: ColumnFilter] }>();
const visible = ref(false);
const draft = ref<ColumnFilter>({});
const error = ref('');
const type = computed(() => archiveFilterType(props.field.key));
const options = computed(() => [...new Set(props.rows.flatMap(row => archiveEnumValues(row[props.field.key], props.field.key)))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', { numeric: true })));
function apply() {
  if ((draft.value.min != null && draft.value.max != null && draft.value.min > draft.value.max) || (draft.value.start && draft.value.end && draft.value.start > draft.value.end)) { error.value = '起始值不能大于结束值'; return; }
  emit('apply', { ...draft.value }); visible.value = false;
}
</script>
<template>
  <el-popover v-model:visible="visible" trigger="click" placement="bottom-end" :width="280" @show="draft = JSON.parse(JSON.stringify(filter || {})); error = ''">
    <template #reference><el-button class="filter-trigger" text size="small" title="筛选" :class="{ active: hasArchiveFilter(filter) }" :icon="Filter" :aria-label="`筛选${field.title}`" @click.stop /></template>
    <div class="column-filter">
      <strong>{{ field.title }}</strong>
      <el-select v-model="draft.presence" placeholder="全部填写状态" clearable aria-label="填写状态"><el-option value="filled" label="已填写" /><el-option value="empty" label="未填写" /></el-select>
      <el-select v-if="type === 'enum'" v-model="draft.values" multiple filterable clearable placeholder="选择筛选值" aria-label="筛选值"><el-option v-for="value in options" :key="value" :value="value" :label="value" /></el-select>
      <el-input v-if="type === 'text'" v-model="draft.keyword" placeholder="输入关键词" clearable aria-label="筛选关键词" @keyup.enter="apply" />
      <div v-if="type === 'number'" class="number-range"><el-input-number v-model="draft.min" :min="0" :controls="false" placeholder="最少课时" aria-label="最少课时" /><span>至</span><el-input-number v-model="draft.max" :min="0" :controls="false" placeholder="最多课时" aria-label="最多课时" /></div>
      <template v-if="type === 'date'"><el-date-picker v-model="draft.start" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" aria-label="开始日期" /><el-date-picker v-model="draft.end" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" aria-label="结束日期" /></template>
      <span v-if="error" class="form-error">{{ error }}</span>
      <div class="popover-actions"><el-button size="small" @click="emit('apply', {}); visible = false">重置</el-button><el-button size="small" @click="visible = false">取消</el-button><el-button size="small" type="primary" @click="apply">确定</el-button></div>
    </div>
  </el-popover>
</template>

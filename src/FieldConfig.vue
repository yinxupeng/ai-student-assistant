<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import draggable from 'vuedraggable';
import { ElMessageBox } from 'element-plus';
import { Rank, ArrowUp, ArrowDown, Delete, Plus } from '@element-plus/icons-vue';
import type { ArchiveField } from './archiveTypes';
import { standardArchiveFields, defaultArchiveFieldKeys, requiredArchiveFieldKeys } from './archiveData';
import { archive, fields, storageKeys, readStorage, saveConfiguration } from './archiveStore';
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>();
const selected = ref<string[]>([]);
const custom = ref<ArchiveField[]>([]);
const order = ref<string[]>([]);
const name = ref('');
const error = ref('');
const allFields = computed(() => [...standardArchiveFields, ...custom.value]);
const movable = computed({
  get: () => order.value.map(key => allFields.value.find(field => field.key === key)).filter((field): field is ArchiveField => Boolean(field && !field.required)),
  set: (value: ArchiveField[]) => { order.value = [...requiredArchiveFieldKeys, ...value.map(field => field.key)]; },
});
watch(() => props.modelValue, (open) => {
  if (!open) return;
  selected.value = [...archive.visibleKeys]; custom.value = archive.customFields.map(field => ({ ...field }));
  const saved = readStorage<string[]>(storageKeys.order, []);
  order.value = [...new Set([...requiredArchiveFieldKeys, ...(Array.isArray(saved) && saved.length ? saved : archive.visibleKeys), ...fields.value.map(field => field.key)])].filter(key => fields.value.some(field => field.key === key));
  name.value = ''; error.value = '';
});
function toggle(key: string, checked: boolean) { selected.value = checked ? [...new Set([...selected.value, key])] : selected.value.filter(item => item !== key); }
function move(index: number, delta: number) {
  const items = [...movable.value]; const target = index + delta;
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]]; movable.value = items;
}
function add() {
  const title = name.value.trim();
  if (custom.value.length >= 5) { error.value = '最多支持5个自定义字段'; return; }
  if (!title) { error.value = '请输入字段名称'; return; }
  if (title.length > 20) { error.value = '字段名称最多20个字'; return; }
  if (title === '操作' || allFields.value.some(field => field.title.toLocaleLowerCase() === title.toLocaleLowerCase())) { error.value = '字段名称已存在'; return; }
  const field = { key: `custom_${crypto.randomUUID()}`, title, custom: true, width: 200 };
  custom.value.push(field); order.value.push(field.key); selected.value.push(field.key); name.value = ''; error.value = '';
}
async function remove(field: ArchiveField) {
  try {
    await ElMessageBox.confirm('该字段将从配置列表和学生表格中移除，保存配置后生效。', `删除自定义字段“${field.title}”？`, { type: 'warning', confirmButtonText: '删除字段', cancelButtonText: '取消' });
    custom.value = custom.value.filter(item => item.key !== field.key); order.value = order.value.filter(key => key !== field.key); selected.value = selected.value.filter(key => key !== field.key); error.value = '';
  } catch { /* Cancellation preserves the field. */ }
}
function reset() { selected.value = [...defaultArchiveFieldKeys, ...custom.value.map(field => field.key)]; order.value = allFields.value.map(field => field.key); }
function save() { if (saveConfiguration(custom.value, selected.value, order.value)) { emit('saved'); emit('update:modelValue', false); } }
</script>
<template>
  <el-drawer :model-value="modelValue" title="配置学生档案展示字段" size="560px" class="field-drawer" @update:model-value="emit('update:modelValue', $event)">
    <div class="field-config-actions"><el-button size="small" @click="reset">恢复默认</el-button><el-button size="small" @click="selected = allFields.map(field => field.key)">全选</el-button><el-button size="small" @click="selected = [...requiredArchiveFieldKeys]">清空可选</el-button></div>
    <div class="section-heading"><h3>展示字段与顺序</h3><span class="muted">已选 {{ selected.length }} 个字段</span></div>
    <div class="field-order-row"><el-checkbox :model-value="true" disabled aria-label="展示学生姓名" /><span class="order-index">1</span><span class="field-name">学生姓名</span><el-tag type="info" size="small">固定左侧</el-tag></div>
    <draggable v-model="movable" item-key="key" handle=".drag-handle" :animation="160" ghost-class="field-ghost">
      <template #item="{ element: field, index }"><div class="field-order-row">
        <el-checkbox :model-value="selected.includes(field.key)" :aria-label="`展示${field.title}`" @change="toggle(field.key, Boolean($event))" />
        <el-icon class="drag-handle" aria-label="拖动排序"><Rank /></el-icon><span class="order-index">{{ index + 2 }}</span><span class="field-name">{{ field.title }}</span>
        <el-tag v-if="field.custom" size="small">自定义</el-tag>
        <el-tooltip content="上移"><el-button text size="small" :icon="ArrowUp" :disabled="index === 0" :aria-label="`上移${field.title}`" @click="move(index, -1)" /></el-tooltip>
        <el-tooltip content="下移"><el-button text size="small" :icon="ArrowDown" :disabled="index === movable.length - 1" :aria-label="`下移${field.title}`" @click="move(index, 1)" /></el-tooltip>
        <el-tooltip v-if="field.custom" content="删除字段"><el-button text type="danger" size="small" :icon="Delete" :aria-label="`删除自定义字段${field.title}`" @click="remove(field)" /></el-tooltip>
      </div></template>
    </draggable>
    <div class="field-order-row"><el-checkbox :model-value="true" disabled aria-label="展示操作" /><span class="order-index">{{ order.length + 1 }}</span><span class="field-name">操作</span><el-tag type="info" size="small">固定右侧</el-tag></div>
    <section class="custom-field-section"><div class="section-heading"><span class="muted">添加自定义字段</span><span class="muted">{{ custom.length }}/5</span></div>
      <div class="custom-field-input"><el-input v-model="name" size="small" :maxlength="20" :disabled="custom.length >= 5" :placeholder="custom.length >= 5 ? '已达到5个字段上限' : '输入字段名称'" aria-label="自定义字段名称" @input="error = ''" @keyup.enter="add" /><el-button size="small" :icon="Plus" :disabled="custom.length >= 5" @click="add">新增字段</el-button></div><p v-if="error" class="form-error">{{ error }}</p>
    </section>
    <template #footer><el-button @click="emit('update:modelValue', false)">取消</el-button><el-button type="primary" @click="save">保存配置</el-button></template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ElMessageBox, type InputInstance } from 'element-plus';
import { EditPen, Check, Close, Delete } from '@element-plus/icons-vue';
import { isArchiveEmpty } from './archiveQuery.js';
const props = defineProps<{ value: string; label: string; confirm?: boolean; save: (text: string) => boolean; removable?: boolean }>();
const emit = defineEmits<{ remove: [] }>();
const editing = ref(false);
const draft = ref('');
const pending = ref(false);
const input = ref<InputInstance>();
async function start() {
  draft.value = isArchiveEmpty(props.value) ? '' : props.value;
  editing.value = true;
  await nextTick(); input.value?.focus();
}
async function submit() {
  if (pending.value || !editing.value) return;
  if (draft.value === props.value) { editing.value = false; return; }
  pending.value = true;
  try {
    if (props.confirm) await ElMessageBox.confirm(`修改前：${props.value || '--'}\n修改后：${draft.value || '--'}`, `确认修改${props.label}？`, { confirmButtonText: '确认修改', cancelButtonText: '取消', distinguishCancelAndClose: true, customClass: 'field-confirm' });
    if (props.save(draft.value.trim())) editing.value = false;
  } catch { /* Cancellation leaves the draft available without saving. */ }
  finally { pending.value = false; }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); editing.value = false; }
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); void submit(); }
}
</script>
<template>
  <div v-if="editing" class="plain-cell-editor">
    <el-input ref="input" v-model="draft" type="textarea" :autosize="{ minRows: 2 }" :aria-label="label" @keydown="onKeydown" @blur="submit" />
    <div class="cell-edit-actions" @mousedown.prevent>
      <el-tooltip content="保存"><el-button size="small" type="primary" :icon="Check" :loading="pending" :aria-label="`保存${label}`" @click="submit" /></el-tooltip>
      <el-tooltip content="取消"><el-button size="small" :icon="Close" :aria-label="`取消编辑${label}`" @click="editing = false" /></el-tooltip>
    </div>
  </div>
  <div v-else class="editable-cell">
    <button class="cell-value" :class="{ 'empty-value': isArchiveEmpty(value) }" :aria-label="`编辑${label}`" @click="start">{{ isArchiveEmpty(value) ? '--' : value }}</button>
    <span class="cell-inline-actions">
      <el-tooltip content="编辑"><el-button class="cell-icon" text size="small" :icon="EditPen" :aria-label="`编辑${label}`" @click="start" /></el-tooltip>
      <el-tooltip v-if="removable" content="删除计划"><el-button class="cell-icon subdued-delete" text size="small" :icon="Delete" :aria-label="`删除${label}`" @click="emit('remove')" /></el-tooltip>
    </span>
  </div>
</template>

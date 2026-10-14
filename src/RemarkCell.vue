<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue';
import { ChatDotSquare, EditPen } from '@element-plus/icons-vue';
import { isArchiveEmpty } from './archiveQuery.js';
const props = defineProps<{ value: string; label: string; student: string; remark: string; save: (text: string) => boolean; navigate?: () => void }>();
const open = ref(false);
const editing = ref(false);
const draft = ref('');
const anchor = ref<HTMLElement>();
const panel = ref<HTMLElement>();
let timer: ReturnType<typeof setTimeout> | undefined;
function show(edit: boolean) { clearTimeout(timer); draft.value = props.remark; editing.value = edit; open.value = true; }
function navigate(event: MouseEvent) { if (event.detail < 2 && props.navigate) timer = setTimeout(() => props.navigate?.(), 350); }
function outside(event: MouseEvent) { if (!anchor.value?.contains(event.target as Node) && !panel.value?.contains(event.target as Node)) open.value = false; }
watch(open, (value) => { document.removeEventListener('mousedown', outside); if (value) document.addEventListener('mousedown', outside); });
onBeforeUnmount(() => { clearTimeout(timer); document.removeEventListener('mousedown', outside); });
</script>
<template>
  <el-popover :visible="open" placement="top-start" :width="300" :title="`${student} · ${label}备注`">
    <template #reference>
      <div ref="anchor" class="remark-cell" @dblclick.prevent.stop="show(true)">
        <button v-if="props.navigate" class="student-link" @click.stop="navigate">{{ value }}</button>
        <span v-else :class="{ 'empty-value': isArchiveEmpty(value) }">{{ isArchiveEmpty(value) ? '--' : value }}</span>
        <el-tooltip v-if="remark" :content="remark" popper-class="remark-tooltip"><el-button text size="small" class="cell-icon remark-indicator" :icon="ChatDotSquare" :aria-label="`查看${label}备注`" @click.stop="show(false)" /></el-tooltip>
      </div>
    </template>
    <div ref="panel">
      <template v-if="editing">
        <el-input v-model="draft" type="textarea" :rows="4" :maxlength="2000" show-word-limit :aria-label="`${label}备注`" />
        <div class="popover-actions"><el-button size="small" @click="open = false">取消</el-button><el-button size="small" type="primary" @click="save(draft.trim()) && (open = false)">保存</el-button></div>
      </template>
      <template v-else><p class="remark-body">{{ remark }}</p><el-button size="small" :icon="EditPen" @click="editing = true">编辑备注</el-button></template>
    </div>
  </el-popover>
</template>

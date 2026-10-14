<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { EditPen, Check, Close } from '@element-plus/icons-vue';
import { isArchiveEmpty } from './archiveQuery.js';
const props = defineProps<{ value: string; document?: JSONContent; label: string; save: (text: string, document: JSONContent) => boolean }>();
const editing = ref(false);
const documentForValue = () => props.document || { type: 'doc', content: props.value.split('\n').map(text => ({ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) })) };
const editor = useEditor({ extensions: [StarterKit, TextStyle, Color], content: documentForValue(), editable: false, editorProps: { attributes: { 'aria-label': props.label } } });
const colors = [['默认', '#344054'], ['红色', '#cf1322'], ['橙色', '#ad4e00'], ['绿色', '#237804'], ['蓝色', '#0958d9']];
const bubbleOptions = { placement: 'top' as const, strategy: 'fixed' as const, offset: 8, flip: true, shift: { padding: 8 } };
const appendTo = () => window.document.body;
const shouldShow = ({ editor: instance, from, to }: { editor: Pick<NonNullable<typeof editor.value>, 'isEditable' | 'isFocused' | 'state'>; from: number; to: number }) => instance.isEditable && instance.isFocused && !instance.state.selection.empty && instance.state.doc.textBetween(from, to).length > 0;
watch([editing, () => props.value, () => props.document, editor], () => {
  if (!editor.value) return;
  editor.value.setEditable(editing.value);
  if (editing.value) editor.value.commands.focus();
  else editor.value.commands.setContent(documentForValue(), { emitUpdate: false });
});
function submit() {
  if (editor.value && props.save(editor.value.getText({ blockSeparator: '\n' }), editor.value.getJSON())) editing.value = false;
}
onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="rich-cell" :class="{ 'is-editing': editing }">
    <BubbleMenu v-if="editor && editing" class="archive-format-float" :editor="editor" :append-to="appendTo" :options="bubbleOptions" :should-show="shouldShow">
      <div class="format-bubble" role="toolbar" aria-label="文字格式" @mousedown.prevent>
        <el-tooltip content="加粗"><el-button text size="small" :class="{ 'is-active': editor.isActive('bold') }" aria-label="加粗" @click="editor.chain().focus().toggleBold().run()"><b>B</b></el-button></el-tooltip>
        <el-tooltip v-for="[name, color] in colors" :key="color" :content="`${name}字体`"><button class="color-swatch" :style="{ background: color }" :aria-label="`${name}字体`" :aria-pressed="editor.isActive('textStyle', { color })" @click="editor.chain().focus().setColor(color).run()" /></el-tooltip>
      </div>
    </BubbleMenu>
    <div class="rich-content" :role="editing ? undefined : 'button'" :tabindex="editing ? undefined : 0" :aria-label="editing ? undefined : `编辑${label}`" @click="editing = true" @keydown.enter="!editing && (editing = true)">
      <span v-if="!editing && isArchiveEmpty(value)" class="empty-value">--</span>
      <EditorContent v-else-if="editor" :editor="editor" />
    </div>
    <div v-if="editing" class="cell-edit-actions">
      <el-tooltip content="保存"><el-button size="small" type="primary" :icon="Check" :aria-label="`保存${label}`" @click="submit" /></el-tooltip>
      <el-tooltip content="取消"><el-button size="small" :icon="Close" :aria-label="`取消编辑${label}`" @click="editing = false" /></el-tooltip>
    </div>
    <el-tooltip v-else content="编辑"><el-button class="cell-icon" text size="small" :icon="EditPen" :aria-label="`编辑${label}`" @click="editing = true" /></el-tooltip>
  </div>
</template>

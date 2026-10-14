# 学生档案

学生档案主系统使用 Vue 3、TypeScript、Element Plus。姓名打开的独立 HTML 演示页面维持原内容。

## 运行

```sh
pnpm install
pnpm dev
```

开发入口为 `/app.html`。

```sh
pnpm build
pnpm test
```

构建后直接打开根目录 `index.html`，不需要启动服务。GitHub Pages 也以此文件作为入口。

## 目录

- `src/ArchiveApp.vue`：学生列表、筛选和排序。
- `src/FieldConfig.vue`：勾选、排序和自定义字段。
- `src/ServicePlans.vue`：月度计划宫格和时间轴。
- `src/CellEditor.vue`、`RichCell.vue`、`RemarkCell.vue`：编辑、文字标记和备注。
- `src/archiveStore.ts`：复用旧版 localStorage 存储键。
- `src/archiveData.ts`：标准档案字段和演示数据。
- `legacy.html`、`src/App.jsx`：保留的原版功能入口，不在主系统加载。

所有编辑内容保存在当前浏览器，不同设备和浏览器之间不会同步。

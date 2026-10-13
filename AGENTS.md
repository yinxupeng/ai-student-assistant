# Prototype Instructions

For static pages, prefer making the prototype viewable by opening `index.html` directly in a browser. Do not start a local server for static HTML/CSS/JS unless the user explicitly asks for it or the feature requires a build step, routing fallback, API proxy, or other server-only behavior.

When a local server is genuinely required, run it yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Product Context

自定义字段在配置排序列表中显示“自定义”标签并支持删除，标准字段无删除入口；确认删除后修改草稿，保存配置后生效，释放5个字段名额并清除该字段的生效筛选条件。

字段配置支持最多5个自定义文本字段，名称不可重复或为空，新增默认勾选，支持与标准字段一起排序；保存配置后生效。各学生的自定义字段内容默认可点击编辑，支持关键词和填写状态筛选，字段定义与内容本机持久化。

左侧菜单暂时只显示“学生档案”，其他菜单隐藏；默认进入学生档案，其他页面及已有功能入口保留。

学生档案列宽需为表头文字及筛选、排序图标留足空间，普通列最小140px，风险与提醒及最近跟进记录260px；长内容继续完整折行展示。

学生档案每列支持列头筛选：枚举多选、文本关键词、课时数值范围、日期范围及已填写/未填写。同字段多选为或，不同字段为且。姓名、学校、负责人、年级、毕业年份、课时、服务日期和语言截止支持单列排序，空值始终最后。顶部显示可移除的生效条件，重置清除筛选和排序；多国家字段按包含匹配，混合日期字段按任一日期范围匹配，月份日期保留整月精度。

字段配置使用一套完整字段排序列表，每行前面显示勾选框，同时支持勾选展示、拖拽和上下移动排序，不再展示下方分组勾选区。取消勾选不移除配置行，重新勾选保持排序位置；保存后列表按自定义顺序展示并持久化。学生姓名保持首列固定左侧，操作保持末列固定右侧，两列必须勾选。

学生档案不可编辑的信息单元格支持双击添加备注；备注按学生和字段分别保存，有备注显示小图标，鼠标悬停图标展示备注，点击可查看并编辑备注。备注不覆盖原字段内容，清空并保存后取消图标。

学生档案表格的横向和纵向分隔线统一使用1px浅色（#f0f0f0），仅用于区分信息，不加粗或加深颜色。

服务计划抽屉支持“宫格 / 时间轴”切换，时间轴按1至12月横向展示；两种视图共用同一份草稿，每个月支持多条计划的新增、编辑、删除，统一保存，切换视图不丢失修改，兼容原有单条月度计划。

学生档案的“问学情Agent”按钮位于页面内容标题栏右侧，放在“字段配置”按钮前面。

“风险与提醒”和“最近跟进记录”支持局部文字加粗、字体颜色标记，仅在编辑时选中文字后在选区旁显示小浮层格式工具栏，不嵌入文本框、不占文本布局空间，取消文字选区后隐藏，显式保存或取消，保存后表格保留格式，搜索使用纯文字内容。

学生档案可编辑字段支持点击单元格文字直接进入编辑状态，同时保留编辑图标入口。

“目标专业/专业方向”和“选课/考试局”的修改需展示修改前后的确认弹窗，确认后才保存生效，取消不提交。

学生档案页面不展示“统一标准档案字段”标签、两表合并说明提示或来源表数量标签，保留字段配置和基础列表统计。

学生档案的“风险与提醒”“最近跟进记录”“目标院校/学校”“目标专业/专业方向”“选课/考试局”“学科目标分”“学科当前情况”支持单元格内编辑并保存。列表列宽保持紧凑，文本完整折行展示，不使用省略号截断内容。

学生档案列表的学生姓名列固定在左侧，横向滚动时保持可见；操作列仅保留“服务计划”，学生姓名仍可点击查看档案。服务计划在右侧抽屉中按年份展示1至12月的月份日历，每个学生按月份独立维护跟进计划。跟进计划直接在月份格子内编辑，支持一次保存多个月的修改，不展示实际跟进记录。列表操作不展示详情、续费或客诉入口。

`10W+用户画像` refers to historical customers who have already spent over 100,000 RMB. The product should summarize this customer group's profile traits, distribution patterns, successful complaint-handling experience, renewal experience, and reusable cases, so teachers can understand what 10W+ customers look like and use that knowledge to judge current users' complaint handling, renewal strategy, and profile match.

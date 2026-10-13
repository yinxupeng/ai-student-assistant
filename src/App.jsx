import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { getServicePlanItems, serializeServicePlanItems } from "./servicePlans";
import { archiveFilterType, archiveEnumValues, isArchiveSortable, hasArchiveFilter, matchesArchiveFilter, compareArchiveRows } from "./archiveQuery";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Alert,
  App as AntApp,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  Layout,
  List,
  Menu,
  Popover,
  Progress,
  Row,
  Select,
  Segmented,
  Space,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import {
  AlertOutlined,
  AuditOutlined,
  BookOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HolderOutlined,
  BarsOutlined,
  DeleteOutlined,
  FilterOutlined,
  PlusOutlined,
  BoldOutlined,
  CloseOutlined,
  EditOutlined,
  SaveOutlined,
  LeftOutlined,
  RightOutlined,
  ClusterOutlined,
  HistoryOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PhoneOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function isNoComplaint(level) {
  return level === "无客诉";
}

function isPreWarning(level) {
  return level === "预警";
}

function hasComplaintRisk(level) {
  return !isNoComplaint(level);
}

function getRiskLevelOptions(includeNoComplaint = true) {
  return includeNoComplaint ? ["全部", "无客诉", "预警", "绿色", "黄色", "红色", "黑色"] : ["全部", "预警", "绿色", "黄色", "红色", "黑色"];
}

const users = [
  {
    id: "u-yellow",
    name: "林子涵",
    stage: "高一 / 国际方向",
    level: "黄色",
    risk: 68,
    value: 58,
    spent: "2.4万",
    chance: "3.2万",
    products: ["学科培训"],
    owner: "班主任 王佳",
    advisor: "顾问 陈晨",
    planner: "升学规划 刘洋",
    action: "先修复教学体验，再观察续费窗口",
    profile: "家长近一周多次反馈孩子听课吃力，课程消耗已到40%，阶段测提升不明显。当前不建议销售介入。",
    tags: ["老师匹配", "效果焦虑", "作业下滑"],
    learning: { attendance: 82, homework: 54, mock: "+3分", course: "已消耗40%" },
    communication: { emotion: "负向上升", focus: "阶段效果和老师匹配", promise: "顾问曾承诺4周内建立稳定学习节奏" },
    complaint: {
      ticket: "CS-2026-0615-02",
      category: "教学匹配",
      source: "企微聊天 + 作业数据",
      owner: "班主任 王佳",
      deadline: "24小时内首次闭环",
      status: "处理中",
      compensation: "可提供1次教学诊断和1次替换老师试听；不建议现金补偿。",
      forbid: ["不要承诺短期提分", "不要将问题归因给学生不配合", "不要直接推进续费"],
      excerpts: ["家长：孩子说老师讲太快，最近越来越听不懂。", "家长：上了这么多节课，感觉没有效果。", "班主任记录：作业完成率连续两次下降。"],
      followups: ["24小时：确认情绪是否缓和", "3天：确认换老师/旁听是否执行", "7天：确认满意度是否恢复", "14天：判断是否进入续费窗口"],
      review: ["归因：教学节奏与学习反馈不足", "处理目标：先恢复服务信任", "结案标准：家长认可调整方案且作业完成率回升"],
    },
    evidence: ["企微7天内3次出现“没效果、听不懂、讲太快”。", "最近2次作业完成率由86%降至54%。", "学生课堂互动次数连续两节下降。", "家长询问“是不是老师不适合孩子”。"],
    sop: ["班主任当天电话安抚，先承认体验问题并约定处理时点。", "教学主管旁听最近一次课程，输出老师匹配诊断。", "教务安排一次替换老师试听，48小时内给家长确认。", "生成阶段学习诊断报告，明确薄弱点、调整方案和下次验证节点。"],
    talk: "您反馈的重点不是简单换老师，而是孩子当前节奏和吸收情况需要重新校准。今天我们先把课堂节奏、作业反馈和老师匹配一起复盘。",
    renewal: {
      fit: "暂缓续费",
      similarity: 42,
      path: "体验修复后再续排课",
      timing: "黄色客诉降级后7天",
      ownerRole: "班主任先修复，顾问暂缓介入",
      products: ["阶段学习诊断", "老师匹配优化"],
      reason: "当前处于黄色客诉修复期，直接续费会放大不满。先恢复信任，再判断是否续排课。",
      evidence: ["作业完成率下降至54%", "家长连续反馈没效果", "课程消耗已到40%", "老师匹配存在疑问"],
      objections: ["为什么还要继续上课", "之前没效果怎么保证调整有效"],
      tasks: ["完成教学主管旁听", "输出阶段学习诊断", "安排替换老师试听", "7天后评估是否可续排"],
      recommendations: [
        { product: "阶段学习诊断", type: "修复服务", price: "服务动作", role: "班主任", timing: "立即", reason: "先用诊断报告重建服务价值感。" },
        { product: "老师匹配优化", type: "体验修复", price: "服务动作", role: "教务", timing: "48小时内", reason: "当前主要矛盾是课堂节奏和老师匹配。" },
      ],
    },
    dims: [55, 62, 70, 48, 38, 45],
  },
  {
    id: "u-red",
    name: "周亦然",
    stage: "高三 / 英国本科申请",
    level: "红色",
    risk: 91,
    value: 76,
    spent: "8.6万",
    chance: "2.8万",
    products: ["升学规划", "文书服务", "笔试面试"],
    owner: "升学规划 刘洋",
    advisor: "顾问 赵敏",
    planner: "升学规划 刘洋",
    action: "主管介入，先做事实链和补救路径",
    profile: "申请结果未达到家庭预期，家长质疑规划价值并提出退费。涉及多产品服务，需主管统一口径。",
    tags: ["退费", "结果不可逆", "品牌质疑"],
    learning: { attendance: 94, homework: 88, mock: "申请结果偏离目标", course: "服务完成85%" },
    communication: { emotion: "强负向", focus: "申请结果与服务价值", promise: "早期顾问表达过较强结果预期" },
    complaint: {
      ticket: "CS-2026-0615-01",
      category: "结果不可逆 / 退费",
      source: "企微聊天 + 规划服务记录 + 文书交付记录",
      owner: "主管 李明",
      deadline: "2小时内主管介入",
      status: "升级处理中",
      compensation: "可提供补申咨询、面试复盘、额外规划会议；退款/赔偿需经理审批。",
      forbid: ["不要继续推新产品", "不要强调申请结果不可控", "不要由一线员工单独沟通", "不要否认早期沟通承诺"],
      excerpts: ["家长：规划到底有什么价值？结果这样我们要求退费。", "顾问早期沟通：目标院校冲刺成功概率较高。", "服务记录：文书修改4轮，规划会议6次，申请节点均已完成。"],
      followups: ["2小时：主管首次沟通", "24小时：交付事实链", "3天：补救路径确认", "7天：退费诉求是否降级", "14天：结案复盘"],
      review: ["归因：结果不达预期 + 预期管理不足", "处理目标：从争责转向过程复盘和补救路径", "结案标准：退费诉求降级或形成书面处理结论"],
    },
    evidence: ["企微明确出现“退费、赔偿、规划没价值”。", "早期顾问沟通存在较强结果预期表达。", "用户已购买三个产品，品牌信任受损风险高。", "申请结果已不可逆，解释型沟通容易激化。"],
    sop: ["红色客诉升级至主管，不建议一线员工单独处理。", "整理服务履约事实链：规划会、文书修改、申请节点、面试辅导。", "沟通目标从解释结果转为过程复盘和补救路径。", "暂停销售动作，复盘顾问承诺边界。"],
    talk: "这次结果没有达到您的预期，我们先不急着解释责任。我会把整个规划、申请和交付过程完整拉出来复盘，同时给您一套仍然可以执行的补救路径。",
    renewal: {
      fit: "不建议销售",
      similarity: 64,
      path: "红色客诉闭环后保留补救服务",
      timing: "退费诉求降级后",
      ownerRole: "主管主导，顾问暂停销售",
      products: ["补申咨询", "面试复盘", "规划补救会"],
      reason: "该用户仍有高价值基础，但当前信任受损。先完成红色客诉闭环。",
      evidence: ["累计消费8.6万", "已购买三个产品", "目标明确但结果不达预期", "信任基础显著受损"],
      objections: ["你们规划没有价值", "现在推荐任何服务都像继续收费"],
      tasks: ["主管完成首次沟通", "整理服务履约事实链", "确认补救路径", "退费诉求降级后再评估"],
      recommendations: [
        { product: "补申咨询", type: "补救服务", price: "轻量补偿", role: "升学规划", timing: "事实链沟通后", reason: "用可执行补救路径替代解释争责。" },
        { product: "面试复盘", type: "补救服务", price: "轻量补偿", role: "规划老师", timing: "3天内", reason: "承接不可逆结果后的下一步行动。" },
      ],
    },
    dims: [74, 86, 82, 35, 78, 22],
  },
  {
    id: "u-high",
    name: "陈思远",
    stage: "初三 / 海外本科长期规划",
    level: "无客诉",
    risk: 23,
    value: 88,
    spent: "4.8万",
    chance: "9.6万",
    products: ["学科培训", "语陪"],
    owner: "班主任 孙悦",
    advisor: "顾问 唐宁",
    planner: "升学规划 梁琪",
    action: "用路径诊断切入升学规划和竞赛组合",
    profile: "家庭目标明确，家长持续询问海外本科准备节奏。已接受课程类产品，适合从路径诊断进入升学规划。",
    tags: ["高参与家长", "目标明确", "多产品潜力"],
    learning: { attendance: 96, homework: 91, mock: "+12分", course: "已消耗55%" },
    communication: { emotion: "稳定正向", focus: "长期路径和时间规划", promise: "班主任承诺输出阶段学习成果报告" },
    complaint: {
      ticket: "CS-2026-0615-03",
      category: "无客诉 / 体验稳定",
      source: "企微聊天 + 学情数据",
      owner: "班主任 孙悦",
      deadline: "持续观察",
      status: "观察中",
      compensation: "无需补偿，建议维护学习成果可视化。",
      forbid: ["不要一次性打包高价方案", "不要跳过路径诊断直接销售"],
      excerpts: ["家长：海外本科是不是现在就要开始准备？", "班主任记录：出勤率96%，语陪课反馈良好。", "家长多次询问竞赛和暑期营地。"],
      followups: ["本周：输出阶段学习成果", "下周：安排路径诊断", "30天：评估规划转化机会"],
      review: ["归因：长期目标明确，体验稳定", "处理目标：维护信任并进入规划诊断", "结案标准：完成路径诊断并生成产品组合建议"],
    },
    evidence: ["家长近30天6次询问海外本科准备事项。", "学科课出勤率96%，语陪课续课意愿较高。", "家庭关注竞赛、营地和背景提升。", "与10W+用户路径相似：课程起步，规划牵引，多产品组合。"],
    sop: ["班主任先输出阶段学习成果报告，建立服务价值感。", "升学规划老师安排一次路径诊断，明确3年准备节奏。", "顾问跟进规划服务，并关联竞赛和暑期营地。", "建立季度目标复盘机制，避免单次销售式沟通。"],
    talk: "您现在关注的不只是当前成绩，而是未来三年怎么准备海外本科。我们建议先做一次路径诊断，把学科、语言、竞赛和营地放到同一张时间表里看。",
    renewal: {
      fit: "强推荐",
      similarity: 82,
      path: "课程信任到升学规划牵引，再进入竞赛/营地组合",
      timing: "本周安排路径诊断",
      ownerRole: "升学规划切入，顾问跟进组合方案",
      products: ["升学规划", "竞赛辅导", "暑期营地", "学科续排"],
      reason: "目标明确、家长参与高、已购买课程和语陪，和10W+多产品用户路径高度相似。",
      evidence: ["家长30天内6次询问海外本科", "出勤率96%", "已购买学科和语陪", "关注竞赛与暑期营地"],
      objections: ["现在做规划会不会太早", "是否一定需要竞赛和营地"],
      tasks: ["班主任输出阶段学习成果", "升学规划安排路径诊断", "顾问准备产品组合方案", "30天跟踪转化结果"],
      recommendations: [
        { product: "升学规划", type: "核心转化", price: "2万起", role: "升学规划", timing: "本周", reason: "家长关注长期路径，规划服务能承接目标焦虑。" },
        { product: "竞赛辅导", type: "扩体系推荐", price: "2万起", role: "顾问", timing: "路径诊断后", reason: "海外本科方向需要背景提升和可展示成果。" },
        { product: "暑期营地", type: "体验型推荐", price: "2万起", role: "顾问", timing: "暑期前", reason: "适合作为低阻力海外体验和背景提升入口。" },
        { product: "学科续排", type: "续排课 Push", price: "2万起", role: "班主任", timing: "课消70%前", reason: "出勤和反馈稳定，适合保持学科连续性。" },
      ],
    },
    dims: [88, 91, 94, 84, 86, 79],
  },
  ...makeAdditionalStudents(),
];

function makeAdditionalStudents() {
  const rows = [
    { id: "u-004", name: "沈安然", stage: "高二 / 美本方向", level: "无客诉", risk: 18, value: 79, spent: "6.2万", chance: "6.8万", products: ["学科培训", "升学规划"], tags: ["目标明确", "课消稳定", "规划潜力"], action: "建议进入续费节奏，推荐竞赛和营地组合" },
    { id: "u-005", name: "王若曦", stage: "初二 / 国际学校备考", level: "黄色", risk: 63, value: 52, spent: "3.1万", chance: "2.4万", products: ["学科培训", "笔试面试"], tags: ["老师匹配", "进度焦虑"], action: "先处理黄色客诉，完成老师匹配和学习诊断" },
    { id: "u-006", name: "赵明轩", stage: "高一 / 英本预备", level: "无客诉", risk: 21, value: 84, spent: "7.4万", chance: "8.6万", products: ["语陪", "升学规划"], tags: ["家长高参与", "语言提升", "多产品潜力"], action: "建议续费语陪并推荐竞赛/文书服务" },
    { id: "u-007", name: "许嘉宁", stage: "高三 / 港本申请", level: "红色", risk: 87, value: 68, spent: "9.1万", chance: "1.8万", products: ["升学规划", "文书服务"], tags: ["退费风险", "结果焦虑", "品牌质疑"], action: "主管介入处理客诉，暂停续费推荐" },
    { id: "u-008", name: "何子墨", stage: "初三 / 美高申请", level: "无客诉", risk: 16, value: 72, spent: "4.5万", chance: "5.6万", products: ["笔试面试", "语陪"], tags: ["面试节点", "服务稳定"], action: "建议推进升学规划和暑期营地推荐" },
    { id: "u-009", name: "刘思琪", stage: "高二 / A-Level", level: "预警", risk: 42, value: 61, spent: "3.8万", chance: "3.1万", products: ["学科培训"], tags: ["技术问题", "互动下降", "潜在客诉"], action: "AI识别潜在客诉风险，班主任先做预警核查和轻量回访" },
    { id: "u-010", name: "马一诺", stage: "高一 / IB方向", level: "无客诉", risk: 19, value: 81, spent: "5.9万", chance: "7.2万", products: ["学科培训", "竞赛"], tags: ["成绩提升", "背景提升", "续费窗口"], action: "建议学科续排，并推荐升学规划服务" },
    { id: "u-011", name: "孙予乔", stage: "初一 / 国际方向", level: "黄色", risk: 66, value: 47, spent: "2.6万", chance: "2.2万", products: ["学科培训"], tags: ["作业下滑", "家长焦虑"], action: "处理学习效果客诉，先输出阶段学习报告" },
    { id: "u-012", name: "唐亦辰", stage: "高二 / 加拿大本科", level: "无客诉", risk: 14, value: 86, spent: "8.2万", chance: "9.8万", products: ["升学规划", "学科培训", "营地"], tags: ["10W+高潜", "多产品", "信任基础"], action: "建议进入高价值续费节奏，推荐文书和竞赛组合" },
    { id: "u-013", name: "顾星河", stage: "高三 / 转学申请", level: "红色", risk: 90, value: 59, spent: "6.7万", chance: "1.2万", products: ["升学规划", "笔试面试"], tags: ["不可逆结果", "赔偿诉求"], action: "升级红色客诉，经理审批补救和补偿边界" },
  ];

  return rows.map((item, index) => {
    const hasComplaint = hasComplaintRisk(item.level);
    const isWarning = isPreWarning(item.level);
    const ownerName = ["王佳", "孙悦", "李明", "陈晨"][index % 4];
    const advisorName = ["唐宁", "赵敏", "陈晨", "许诺"][index % 4];
    const plannerName = ["梁琪", "刘洋", "周宁", "韩知远"][index % 4];
    return {
      ...item,
      owner: `班主任 ${ownerName}`,
      advisor: `顾问 ${advisorName}`,
      planner: `升学规划 ${plannerName}`,
      profile: isWarning
        ? "AI从企微沟通、学情波动和服务记录中识别出潜在客诉信号，当前尚未形成正式客诉，需要班主任先核查并提醒。"
        : hasComplaint
        ? "近期沟通中出现体验不满或结果焦虑，需要先完成客诉分级、处理和回访，再判断续费窗口。"
        : "学习服务体验稳定，家长参与度较高，适合结合课消、目标和10W+画像进入续费与产品推荐判断。",
      learning: { attendance: hasComplaint ? 84 - index : 92 + (index % 5), homework: hasComplaint ? 62 - (index % 8) : 86 + (index % 8), mock: hasComplaint ? "+2分" : `+${8 + (index % 6)}分`, course: hasComplaint ? "已消耗45%" : "已消耗65%" },
      communication: { emotion: hasComplaint ? "负向上升" : "稳定正向", focus: hasComplaint ? "服务体验和学习效果" : "长期规划和续费节奏", promise: "班主任承诺阶段复盘和下一步建议" },
      complaint: {
        ticket: isWarning ? `WARN-2026-0615-${index + 10}` : hasComplaint ? `CS-2026-0615-${index + 10}` : "暂无客诉工单",
        category: isWarning ? "AI预警 / 潜在客诉风险" : hasComplaint ? "学习效果 / 服务体验" : "无客诉 / 体验稳定",
        source: "企微聊天 + 学情数据 + 订单记录",
        owner: hasComplaint ? `班主任 ${ownerName}` : `顾问 ${advisorName}`,
        deadline: isWarning ? "今日完成核查提醒" : hasComplaint ? "24小时内首次闭环" : "本周跟进续费意向",
        status: isWarning ? "预警待核查" : hasComplaint ? "待处理" : "观察中",
        compensation: isWarning ? "无需补偿，先做事实核查、学习反馈和轻量回访。" : hasComplaint ? "可提供学习诊断、回访和轻量补偿；退款赔偿需主管审批。" : "无需补偿，建议维护学习成果可视化。",
        forbid: isWarning ? ["不要直接定义为客诉", "不要放大用户焦虑", "不要跳过核查直接销售"] : hasComplaint ? ["不要直接推进续费", "不要承诺短期结果", "不要忽视家长情绪"] : ["不要一次性打包高价方案", "不要跳过价值说明直接报价"],
        excerpts: isWarning ? ["AI提示：家长近期回复变慢，课堂互动和作业完成略有下降。", "班主任记录：需要确认是否存在体验不满。"] : hasComplaint ? ["家长：最近感觉效果不明显。", "学生：课堂节奏有点跟不上。"] : ["家长：后续课程怎么安排更合适？", "班主任记录：出勤和作业稳定。"],
        followups: isWarning ? ["今日：核查触发原因", "24小时：轻量回访", "3天：观察是否升级"] : hasComplaint ? ["24小时：首次安抚", "3天：执行调整", "7天：满意度回访"] : ["本周：输出学习成果", "下周：确认续费意向"],
        review: isWarning ? ["归因：AI识别潜在负向信号", "目标：提前提醒并避免升级"] : hasComplaint ? ["归因：预期管理和阶段反馈不足", "目标：先恢复信任"] : ["归因：体验稳定", "目标：推进续费与产品匹配"],
      },
      evidence: isWarning
        ? ["AI识别到回复速度、互动数据和作业完成出现轻微下滑。", "尚未出现明确投诉或退费表达。", "需要班主任先做事实核查和体验提醒。"]
        : hasComplaint
        ? ["企微出现效果质疑和体验不满。", "作业完成率近期下滑。", "课程反馈需要班主任回访。"]
        : ["出勤率和作业完成率保持稳定。", "家长持续询问后续学习路径。", "与高价值用户画像存在相似特征。"],
      sop: isWarning
        ? ["核查AI预警触发来源。", "班主任做轻量回访。", "同步教师关注课堂互动。", "3天后判断是否升级或关闭。"]
        : hasComplaint
        ? ["班主任当天安抚并确认问题。", "教学主管复盘课程反馈。", "输出阶段学习诊断。", "回访确认是否降级。"]
        : ["输出阶段学习成果。", "判断续费意向度。", "推荐匹配产品。", "制定续费节奏。"],
      talk: isWarning ? "我们关注到孩子最近课堂互动和作业节奏有一点波动，想先和您确认一下最近学习体验，看看是否需要提前调整。" : hasComplaint ? "我们先把当前学习体验和阶段效果做一次复盘，明确调整方案和验证节点。" : "孩子当前学习状态稳定，我们建议把后续学习目标和产品组合放在一起规划。",
      renewal: {
        fit: hasComplaint ? "暂缓续费" : "强推荐",
        similarity: hasComplaint ? Math.max(35, item.value - 12) : item.value,
        path: isWarning ? "预警核查后再判断续费窗口" : hasComplaint ? "客诉处理后再判断续费窗口" : "学情稳定到续费推荐，再进入扩体系产品",
        timing: isWarning ? "预警关闭后3天" : hasComplaint ? "客诉降级后7天" : "课消65%-75%之间",
        ownerRole: isWarning ? "班主任先核查，顾问暂缓销售介入" : hasComplaint ? "班主任先处理，顾问暂缓介入" : "顾问跟进，班主任提供学情证据",
        products: isWarning ? ["预警核查", "学习反馈"] : hasComplaint ? ["学习诊断", "服务修复"] : ["学科续排", "升学规划", "竞赛/营地"],
        reason: isWarning ? "AI已识别潜在客诉信号，需先确认体验和学情波动原因，避免销售动作触发反感。" : hasComplaint ? "当前存在服务风险，直接销售容易放大不满。" : "学情稳定、目标明确、家长参与度高，适合进入续费推荐。",
        evidence: isWarning ? ["AI识别潜在负向信号", "互动和作业略有波动", "尚未形成正式客诉"] : hasComplaint ? ["存在体验不满", "学习反馈下滑", "需先恢复信任"] : ["出勤稳定", "家长关注路径", "已购产品可延展"],
        objections: isWarning ? ["是不是孩子状态不稳定", "是否需要调整老师或节奏"] : hasComplaint ? ["之前没效果怎么继续", "为什么还要续费"] : ["现在是否太早", "是否需要组合购买"],
        tasks: isWarning ? ["核查预警来源", "完成轻量回访", "同步教师观察", "3天后判断是否关闭"] : hasComplaint ? ["完成客诉处理", "输出学习诊断", "回访满意度", "再判断续费"] : ["输出学习成果", "确认意向度", "推荐产品组合", "制定续费节奏"],
        recommendations: hasComplaint
          ? [{ product: "阶段学习诊断", type: "服务修复", price: "服务动作", role: "班主任", timing: "立即", reason: "先恢复信任。" }]
          : [{ product: "学科续排", type: "续排课 Push", price: "2万起", role: "顾问", timing: "课消70%前", reason: "当前学习状态稳定，适合保持连续性。" }],
      },
      dims: [item.value, 78, 82, hasComplaint ? 45 : 86, hasComplaint ? 48 : 84, hasComplaint ? 52 : 80],
    };
  });
}

const sources = [
  ["内部沟通群", "班主任、教务、教师协同记录", "今日新增 36 条", "success"],
  ["外部沟通群", "家长与服务团队日常沟通", "今日新增 128 条", "success"],
  ["企微聊天记录", "客户一对一沟通、关键词、情绪", "近7天 426 条", "success"],
  ["学科课程录播", "课堂互动、知识点、教师反馈", "本周 18 节", "processing"],
  ["升学规划录播", "规划会、目标、申请节点", "本周 6 场", "processing"],
  ["家长会沟通", "阶段反馈、家长期待、异议", "本月 22 场", "success"],
  ["与客户月会沟通", "月度复盘与承诺事项", "待复盘 9 场", "warning"],
  ["唯寻工作台数据", "订单、排课、课消、成绩、报考", "实时同步", "success"],
];

const extractionItems = [
  ["Q&A内容", "提取家长高频问题、学生疑问、服务承诺和未闭环事项", 86],
  ["作业/模考", "识别作业完成、模考波动、薄弱知识点和学习趋势", 74],
  ["客户反馈", "聚合正负反馈、满意点、异议点和服务体验变化", 68],
  ["客诉信息", "识别退费、投诉、赔偿、效果质疑等风险信号", 91],
];

const products = [
  ["学科培训", "2万起", "续排课 / 扩科", "成绩提升、出勤稳定、薄弱点明确"],
  ["语陪", "2万起", "同体系延伸", "海外方向、口语/标化目标明确"],
  ["升学规划", "2万起", "核心转化", "目标国家、院校路径、家庭焦虑强"],
  ["竞赛", "2万起", "扩体系推荐", "背景提升、理工/商科方向匹配"],
  ["笔试面试", "2万起", "节点型推荐", "申请、转学、入学面试临近"],
  ["文书服务", "2万起", "规划后延伸", "申请材料、故事线、选校策略需要承接"],
  ["论文服务", "2万起", "背景提升", "项目产出、科研经历、专业探索需要呈现"],
];

const archiveFieldStorageKey = "studentArchive.visibleFields.v1";

const standardArchiveFields = [
  { key: "studentName", title: "学生姓名", group: "基础信息", required: true, defaultVisible: true, width: 120, searchable: true, sourceFields: ["学生姓名", "学员姓名"] },
  { key: "gender", title: "性别", group: "基础信息", defaultVisible: false, width: 80, sourceFields: ["性别"] },
  { key: "school", title: "在读学校", group: "基础信息", defaultVisible: true, width: 180, searchable: true, sourceFields: ["在读学校"] },
  { key: "currentGrade", title: "在读年级", group: "基础信息", defaultVisible: true, width: 100, sourceFields: ["在读年级"] },
  { key: "graduationYear", title: "毕业年份", group: "基础信息", defaultVisible: true, width: 100, sourceFields: ["毕业年份", "fall sheet"] },
  { key: "system", title: "学生体系", group: "基础信息", defaultVisible: true, width: 110, filterable: true, sourceFields: ["学生体系"] },
  { key: "homeroomTeacher", title: "当前班主任", group: "归属人员", defaultVisible: true, width: 120, searchable: true, filterable: true, sourceFields: ["当前班主任"] },
  { key: "advisor", title: "当前顾问", group: "归属人员", defaultVisible: true, width: 120, searchable: true, filterable: true, sourceFields: ["当前顾问", "顾问姓名"] },
  { key: "planningAdvisor", title: "规划顾问", group: "归属人员", defaultVisible: false, width: 120, sourceFields: ["顾问姓名", "对接人", "之前服务规划师"] },
  { key: "enrolledSubject", title: "报名学科", group: "产品服务", defaultVisible: true, width: 110, filterable: true, sourceFields: ["报名学科"] },
  { key: "enrolledLanguage", title: "报名语培", group: "产品服务", defaultVisible: false, width: 110, filterable: true, sourceFields: ["报名语培"] },
  { key: "hasPlanning", title: "是否报名规划", group: "产品服务", defaultVisible: true, width: 120, filterable: true, sourceFields: ["是否报名规划"] },
  { key: "unarrangedHours", title: "未排总课时", group: "产品服务", defaultVisible: false, width: 110, sorter: true, sourceFields: ["未排总课时"] },
  { key: "serviceStartDate", title: "开始服务日期", group: "产品服务", defaultVisible: false, width: 130, sorter: true, sourceFields: ["开始服务日期"] },
  { key: "targetCountry", title: "目标国家/地区", group: "目标方向", defaultVisible: true, width: 150, searchable: true, filterable: true, sourceFields: ["目标国家", "单国家/地区 or 多地联申"] },
  { key: "targetSchool", title: "目标院校/学校", group: "目标方向", defaultVisible: true, width: 180, searchable: true, sourceFields: ["目标院校", "目标学校", "倾向的目标国家（地区）/学校"] },
  { key: "targetMajor", title: "目标专业/专业方向", group: "目标方向", defaultVisible: true, width: 180, searchable: true, sourceFields: ["目标专业", "专业方向"] },
  { key: "courseSelection", title: "选课/考试局", group: "目标方向", defaultVisible: false, width: 240, sourceFields: ["选课", "选课（考试局）"] },
  { key: "subjectTargetScore", title: "学科目标分", group: "学情语言", defaultVisible: false, width: 130, sourceFields: ["学科目标分"] },
  { key: "subjectCurrentStatus", title: "学科当前情况", group: "学情语言", defaultVisible: true, width: 260, sourceFields: ["学科当前情况"] },
  { key: "ieltsRequirement", title: "雅思要求", group: "学情语言", defaultVisible: false, width: 150, sourceFields: ["雅思要求"] },
  { key: "ieltsCurrentStatus", title: "雅思当前情况", group: "学情语言", defaultVisible: true, width: 180, sourceFields: ["雅思当前情况"] },
  { key: "languageDeadline", title: "语言递交截止", group: "学情语言", defaultVisible: false, width: 140, sorter: true, sourceFields: ["语言递交截至时间"] },
  { key: "applicationPlan", title: "已确认申请学校及专业", group: "申请进度", defaultVisible: false, width: 300, sourceFields: ["目前已确认的申请学校和对应专业"] },
  { key: "predictedScore", title: "预估分/出分情况", group: "申请进度", defaultVisible: false, width: 220, sourceFields: ["预估分，出分情况"] },
  { key: "applicationStatus", title: "申请进度", group: "申请进度", defaultVisible: false, width: 180, sourceFields: ["申请系统填写情况", "是否递交申请", "是否校代"] },
  { key: "offerStatus", title: "Offer情况", group: "申请进度", defaultVisible: false, width: 260, sourceFields: ["英国截至目前offer情况", "其他地区截至目前offer情况"] },
  { key: "firmInsurance", title: "Firm/Insurance", group: "申请进度", defaultVisible: false, width: 180, sourceFields: ["Firm/Insurance Choices"] },
  { key: "riskNotes", title: "风险与提醒", group: "风险备注", defaultVisible: true, width: 280, searchable: true, sourceFields: ["重点需提醒事项", "特殊情况说明", "达con风险", "注意情况"] },
  { key: "latestFollowUp", title: "最近跟进记录", group: "跟进记录", defaultVisible: true, width: 280, sourceFields: ["月度跟进方案/结果", "沟通记录", "回访情况"] },
];

const defaultArchiveFieldKeys = standardArchiveFields.filter((field) => field.defaultVisible || field.required).map((field) => field.key);
const requiredArchiveFieldKeys = standardArchiveFields.filter((field) => field.required).map((field) => field.key);

const standardArchiveRows = [
  {
    id: "archive-cissy-001",
    source: "Cissy规划表",
    linkedUserId: "u-high",
    studentName: "潘乐妍",
    gender: "女",
    school: "苏州外国语",
    currentGrade: "高二",
    graduationYear: "2028",
    system: "AL",
    advisor: "张翯",
    planningAdvisor: "张翯",
    serviceStartDate: "2025.8",
    targetCountry: "英国",
    targetSchool: "剑桥",
    targetMajor: "机械工程",
    courseSelection: "数学 物理 化学 经济 高数",
    applicationPlan: "剑桥机械工程方向，兼顾 IC、UCL 工程分支",
    riskNotes: "参加帮咨后不满意更换规划带案，需要持续 push 学科先修。",
    latestFollowUp: "0831 专业梳理，初阶竞赛，提醒 AMC10。",
  },
  {
    id: "archive-cissy-002",
    source: "Cissy规划表",
    linkedUserId: "u-yellow",
    studentName: "梁紫滢",
    gender: "女",
    school: "广东顺德德胜学校",
    currentGrade: "高二",
    graduationYear: "2028",
    system: "IB",
    advisor: "张员畅-杨晨曦",
    planningAdvisor: "张员畅-杨晨曦",
    serviceStartDate: "2025.9",
    targetCountry: "香港",
    targetSchool: "港三",
    targetMajor: "经济/会计金融",
    courseSelection: "HL 数学AA 经济 英语B / SL 生物 化学 中文A",
    applicationPlan: "香港商科为主，保留澳洲和英国方向。",
    riskNotes: "需要开摄像头、多 push，每半个月检查错题，帮助关注香港夏校。",
    latestFollowUp: "0917 文社科与心理学对比，跟踪 SMC、雅思和 NEC 组队。",
  },
  {
    id: "archive-cissy-003",
    source: "Cissy规划表",
    linkedUserId: "u-red",
    studentName: "方禹熹",
    gender: "男",
    school: "宁波",
    currentGrade: "高三",
    graduationYear: "2027",
    system: "IB",
    advisor: "杨晨熙",
    planningAdvisor: "杨晨熙",
    targetCountry: "英国",
    targetSchool: "曼大、伯明翰、南安普敦",
    targetMajor: "会计金融",
    courseSelection: "HL 数学AA 商务 英语 / SL 化学 经济 中文",
    predictedScore: "33/42",
    applicationStatus: "UCAS 先交三个学校",
    riskNotes: "IG 不提交，可能影响曼大申请，需要明确沟通边界。",
    latestFollowUp: "6 月分文书，快捷服务，申请策略需持续确认。",
  },
  {
    id: "archive-cissy-004",
    source: "Cissy规划表",
    linkedUserId: "u-004",
    studentName: "史晨露",
    gender: "女",
    school: "新加坡",
    currentGrade: "已毕业",
    graduationYear: "2025",
    system: "IB",
    advisor: "王一涵",
    planningAdvisor: "Cissy",
    targetCountry: "英国",
    targetSchool: "UCL / 曼大",
    targetMajor: "国际管理",
    courseSelection: "SL 中文A 物理 商务 / HL 数学AA 经济 英语B",
    firmInsurance: "UCL / 曼大",
    offerStatus: "曼大、华威、LSE、UCL 等申请结果已记录",
    riskNotes: "等待 firm 结果，需跟进换曼大 uncon。",
    latestFollowUp: "等待 UCL 结果，语言和成绩状态已达 con。",
  },
  {
    id: "archive-wyl-001",
    source: "王彦力班主任表",
    linkedUserId: "u-high",
    studentName: "涂传祺",
    school: "江西科技学院附属中学",
    currentGrade: "11",
    homeroomTeacher: "王彦力",
    advisor: "贾伊人",
    enrolledSubject: "否",
    enrolledLanguage: "否",
    hasPlanning: "是",
    unarrangedHours: 0,
    targetCountry: "英国,香港",
    targetSchool: "G5 港前5",
    targetMajor: "工程-机械",
    courseSelection: "EDX数学 + EDX高数 + CAIE物理 + 经济 + 化学",
    subjectTargetScore: "4-5A*",
    subjectCurrentStatus: "数学 P1a 99，P2a 100；S1 98；10月有物理和数学大考。",
    ieltsRequirement: "总分7.5 小分7.0",
    ieltsCurrentStatus: "未达标，总分7，写作/口语6.5",
    languageDeadline: "香港 2027.10 / 英国 2028.7.30",
    riskNotes: "雅思小分未达标，需要高分班或 1v1 跟进。",
    latestFollowUp: "9月跟进：雅思小分沟通、总成绩沟通、高分班或1v1。",
  },
  {
    id: "archive-wyl-002",
    source: "王彦力班主任表",
    linkedUserId: "u-009",
    studentName: "朱妍珊",
    school: "上海光华学院剑桥国际中心",
    currentGrade: "10",
    homeroomTeacher: "王彦力",
    advisor: "卞立颍",
    enrolledSubject: "是",
    enrolledLanguage: "否",
    hasPlanning: "否",
    unarrangedHours: 0,
    targetCountry: "香港",
    targetSchool: "港校，学生自己喜欢 LSE",
    targetMajor: "待定，理科或商科",
    courseSelection: "数学80多 + 经济76 + 化学 + 会计59 + 生物73",
    subjectTargetScore: "A-A*",
    subjectCurrentStatus: "平均分 70-80，会计57",
    ieltsRequirement: "总分7.0 小分6.5",
    ieltsCurrentStatus: "雅思未达标",
    languageDeadline: "2028.10",
    riskNotes: "目标未定且语言未达标，需要先做规划确认。",
    latestFollowUp: "10-12号雅思模考 + 升学规划。",
  },
  {
    id: "archive-wyl-003",
    source: "王彦力班主任表",
    linkedUserId: "u-006",
    studentName: "王丽",
    school: "杉达 视觉传媒",
    currentGrade: "已毕业",
    homeroomTeacher: "王彦力",
    advisor: "严雅馨",
    enrolledSubject: "否",
    enrolledLanguage: "是",
    hasPlanning: "否",
    unarrangedHours: 0,
    targetCountry: "英国",
    targetSchool: "曼大、UCL、KCL、爱丁堡、伯明翰",
    targetMajor: "视觉传媒",
    ieltsRequirement: "总分7.0小分6.5，或总分6.5小分6.0",
    ieltsCurrentStatus: "雅思未达标",
    languageDeadline: "2027.7",
    riskNotes: "语言是当前核心风险。",
    latestFollowUp: "词汇 + 语法基础班，考虑寒假雅思集训。",
  },
  {
    id: "archive-wyl-004",
    source: "王彦力班主任表",
    linkedUserId: "u-010",
    studentName: "王宋文",
    school: "上海光华学院剑桥国际中心",
    currentGrade: "10",
    homeroomTeacher: "王彦力",
    advisor: "杨萌",
    enrolledSubject: "否",
    enrolledLanguage: "否（模考）",
    hasPlanning: "否",
    unarrangedHours: 0,
    targetCountry: "英国,香港",
    targetMajor: "数物化生 / 生物医学工程",
    courseSelection: "计算机 数学 物化生",
    subjectTargetScore: "4-5A*",
    subjectCurrentStatus: "计算机60多，数学B，物化生80多",
    ieltsCurrentStatus: "雅思未达标",
    riskNotes: "需要补齐目标院校和规划路径。",
    latestFollowUp: "卷子 + 雅思 + 规划。",
  },
  {
    id: "archive-wyl-005",
    source: "王彦力班主任表",
    linkedUserId: "u-012",
    studentName: "黄奕涵",
    school: "上海光华学院剑桥国际中心",
    currentGrade: "10",
    homeroomTeacher: "王彦力",
    advisor: "许诺",
    enrolledSubject: "是",
    enrolledLanguage: "是",
    hasPlanning: "是",
    unarrangedHours: 12,
    targetCountry: "英国",
    targetSchool: "G5",
    targetMajor: "商科/经济",
    courseSelection: "数学 经济 物理",
    subjectTargetScore: "A*AA",
    subjectCurrentStatus: "校内成绩稳定，经济阅读需要跟进。",
    ieltsRequirement: "总分7.0 小分6.5",
    ieltsCurrentStatus: "模考接近目标",
    riskNotes: "高潜用户，适合规划与语培协同推进。",
    latestFollowUp: "建议进入高价值续费节奏，跟进规划和竞赛组合。",
  },
];

function archiveFallback(value) {
  return value === undefined || value === null || value === "" ? "未填写" : value;
}

function getArchiveDisplayValue(record, fieldKey) {
  const value = archiveFallback(record[fieldKey]);
  if (["enrolledSubject", "enrolledLanguage", "hasPlanning"].includes(fieldKey)) {
    return <Tag color={value === "是" ? "blue" : value === "未填写" ? "default" : "default"}>{value}</Tag>;
  }
  if (fieldKey === "source") {
    return <Tag color={record.source?.includes("Cissy") ? "purple" : "cyan"}>{value}</Tag>;
  }
  return value;
}

function getArchiveOptions(rows, key) {
  const values = [...new Set(rows.map((row) => row[key]).filter((value) => value !== undefined && value !== null && value !== ""))];
  return ["全部", ...values].map((value) => ({ value, label: value }));
}

const roleTasks = [
  { key: "t1", role: "班主任", user: "林子涵", task: "电话安抚并同步教学主管旁听安排", source: "AI客诉SOP", due: "今日 18:00", status: "处理中", route: "complaint", userId: "u-yellow" },
  { key: "t2", role: "教务", user: "林子涵", task: "准备替换老师试听与排课方案", source: "黄色客诉处理", due: "明日 12:00", status: "待处理", route: "complaint", userId: "u-yellow" },
  { key: "t3", role: "主管", user: "周亦然", task: "整理规划交付事实链并首次沟通", source: "红色客诉升级", due: "2小时内", status: "高优先级", route: "complaint", userId: "u-red" },
  { key: "t4", role: "升学规划", user: "陈思远", task: "安排海外本科路径诊断", source: "10W+画像推荐", due: "本周五", status: "待处理", route: "renewal", userId: "u-high" },
  { key: "t5", role: "顾问", user: "陈思远", task: "准备规划+竞赛+营地组合方案", source: "续费推荐", due: "路径诊断后", status: "待依赖", route: "renewal", userId: "u-high" },
  { key: "t6", role: "教师", user: "林子涵", task: "本节课放慢节奏并补充课后复盘反馈", source: "学情异常", due: "下次课前", status: "待处理", route: "profile", userId: "u-yellow" },
];

const knowledgeCases = [
  { type: "10W+成功案例", title: "课程信任到规划牵引", scene: "学科+语陪起步，家长持续询问海外本科", result: "8个月累计消费从2.8万提升至12.6万", reusable: "先输出阶段成果，再由规划老师切入长期路径。" },
  { type: "红色客诉案例", title: "结果不理想后的补救闭环", scene: "申请结果低于预期，家长提出退费", result: "退费诉求降级，保留补申服务", reusable: "主管统一事实链，用补救路径替代争责沟通。" },
  { type: "黄色客诉转化", title: "换老师前先做诊断", scene: "老师匹配争议，家长质疑效果", result: "14天风险降级，完成学科续排", reusable: "旁听诊断+替换试听+阶段报告，再判断续费。" },
  { type: "失败案例", title: "客诉修复期强推续费", scene: "黄色客诉未降级，顾问直接推课包", result: "家长反感升级为红色风险", reusable: "客诉未闭环前禁止销售动作。" },
];

const strategyRules = [
  { key: "r1", module: "客诉分级", rule: "出现退费、赔偿、投诉、品牌质疑等关键词，且涉及不可逆结果，默认红色起评。", owner: "主管", status: "启用" },
  { key: "r2", module: "风险关键词", rule: "没效果、被骗、不专业、退费、赔偿、投诉、老师不行进入风险词库并结合频次判断。", owner: "班主任主管", status: "启用" },
  { key: "r3", module: "续费推荐", rule: "黄色及以上客诉未降级时，不生成销售推进任务，只生成体验修复任务。", owner: "销售主管", status: "启用" },
  { key: "r4", module: "10W+画像", rule: "目标明确度、家长参与度、产品延展性、信任基础四项同时接近历史10W+样本时，进入画像匹配池。", owner: "增长负责人", status: "启用" },
  { key: "r5", module: "补偿边界", rule: "红色/黑色客诉涉及退款、赔偿、额外服务承诺时必须主管或经理审批。", owner: "经理", status: "待完善" },
  { key: "r6", module: "话术模板", rule: "不可承诺录取、提分、退款结果；优先表达事实复盘、补救路径和下一步时间点。", owner: "服务运营", status: "启用" },
];

const menuItems = [
  { key: "agent", icon: <RobotOutlined />, label: "学情Agent" },
  { key: "students", icon: <UserOutlined />, label: "学生档案" },
  { key: "highValue", icon: <ClusterOutlined />, label: "10W+用户画像" },
  { key: "complaint", icon: <AlertOutlined />, label: "客诉处理" },
  { key: "renewal", icon: <LineChartOutlined />, label: "续费管理" },
];

const pageTitle = Object.fromEntries(menuItems.map((item) => [item.key, item.label]));

function RiskTag({ level }) {
  const color = { 无客诉: "default", 预警: "orange", 绿色: "green", 黄色: "gold", 红色: "red", 黑色: "default" }[level];
  return <Tag color={color}>{level}</Tag>;
}

function ProductTags({ items }) {
  return <Space size={[6, 6]} wrap>{items.map((item) => <Tag key={item}>{item}</Tag>)}</Space>;
}

function getComplaintStage(user, index = 0) {
  if (user.level === "黑色") return "预警";
  if (user.level === "预警") return "预警";
  if (user.level === "红色") return index % 2 === 0 ? "预警" : "定级";
  if (user.level === "黄色") return index % 2 === 0 ? "处理" : "复盘";
  return index % 2 === 0 ? "回访" : "处理";
}

function getRenewalIntent(user) {
  const score = user.renewal?.similarity ?? user.value;
  if (score >= 85) return "强意向";
  if (score >= 75) return "高意向";
  if (score >= 65) return "中意向";
  if (score >= 50) return "低意向";
  return "暂缓观察";
}

function AppShell() {
  const [route, setRoute] = useState("students");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState("u-high");
  const [generated, setGenerated] = useState(false);
  const selected = users.find((item) => item.id === selectedId) || users[0];

  function go(nextRoute, userId) {
    if (userId) setSelectedId(userId);
    setRoute(nextRoute);
    setGenerated(false);
  }

  const content = useMemo(() => ({
    agent: <LearningAgentPage go={go} />,
    students: <StudentsArchivePage go={go} />,
    highValue: <HighValuePage go={go} />,
    profile: <UserProfile user={selected} go={go} />,
    complaint: <ComplaintPage user={selected} generated={generated} go={go} />,
    complaintDetail: <ComplaintDetailPage user={selected} go={go} generated={generated} />,
    renewal: <RenewalPage user={selected} generated={generated} go={go} />,
    renewalDetail: <RenewalDetailPage user={selected} go={go} generated={generated} />,
  })[route], [route, selectedId, generated]);
  const selectedMenuKey = route === "profile" ? "students" : route === "complaintDetail" ? "complaint" : route === "renewalDetail" ? "renewal" : route;

  return (
    <Layout className="app-layout">
      <Sider className="app-sider" width={196} collapsedWidth={76} collapsed={collapsed} trigger={null}>
        <div className="brand">
          <div className="brand-mark">AI</div>
          {!collapsed ? <Title level={4}>学情助手</Title> : null}
          <Button
            className="sider-collapse-button"
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
          />
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedMenuKey]} items={menuItems.filter((item) => item.key === "students")} onClick={({ key }) => go(key)} />
      </Sider>
      <Layout>
        {route !== "agent" ? (
          <Header className="app-header">
            <div>
              <Title level={2}>{route === "profile" ? "学生详情" : route === "complaintDetail" ? "客诉详情" : route === "renewalDetail" ? "续费详情" : pageTitle[route]}</Title>
            </div>
          </Header>
        ) : null}
        <Content className={route === "agent" ? "app-content agent-only-content" : "app-content"}>
          {content}
        </Content>
      </Layout>
    </Layout>
  );
}

function buildAgentAnswer(user, question) {
  const decision = getUserDecision(user);
  const isComplaint = question.includes("客诉") || hasComplaintRisk(user.level);
  const isRenewal = question.includes("续费") || question.includes("推荐") || user.level === "绿色" || isNoComplaint(user.level);
  const thinking = [
    `识别提问对象：${user.name}，当前阶段为${user.stage}。`,
    `合并数据源：企微沟通、课程进度、作业/模考、订单、客诉记录和10W+画像。`,
    `判断当前状态：${decision.status}，主责角色建议为${decision.owner}。`,
    isPreWarning(user.level) ? `优先核查预警：AI识别该用户可能产生客诉，需要先确认触发原因并提醒班主任跟进。` : isComplaint ? `优先处理风险：客诉等级为${user.level}，需要先控制服务体验和沟通口径。` : `优先挖掘机会：当前风险较低，可进入规划/续费判断。`,
    isRenewal ? `结合10W+画像：相似度${user.renewal.similarity}%，评估产品延展和续费时机。` : `暂缓销售动作：先完成服务修复和回访，再判断续费窗口。`,
  ];
  const conclusion = `${user.name}当前应按“${decision.status}”处理。${decision.summary}`;
  const supportPlan = isNoComplaint(user.level)
    ? ["班主任本周输出阶段学习成果报告。", "顾问判断续费意向度和匹配度。", "推荐匹配产品组合并说明价值。", "制定续费节奏和下一次跟进节点。"]
    : isPreWarning(user.level)
      ? ["班主任今日核查AI预警触发来源。", "轻量回访家长，确认是否存在体验不满。", "同步教师关注课堂互动和作业反馈。", "3天后判断预警关闭、维持观察或升级客诉。"]
      : user.level === "红色"
      ? ["主管2小时内介入，先统一沟通口径。", "整理规划、文书、申请节点和历史承诺事实链。", "暂停所有销售推进，给出补申/面试复盘等补救路径。", "7天内跟踪退费诉求是否降级。"]
      : user.level === "黄色"
        ? ["班主任当天电话安抚，承认体验问题并给出处理时间点。", "教学主管旁听最近一节课，输出老师匹配诊断。", "教务安排替换老师试听，48小时内反馈。", "7天后根据满意度和作业回升情况判断是否进入续费窗口。"]
        : ["班主任当天处理轻微体验问题。", "教务或教师同步调整方案。", "24小时内完成回访。", "确认问题关闭后再进入续费判断。"];
  const evidence = [
    ...user.evidence.slice(0, 3),
    `累计消费${user.spent}，潜在机会${user.chance}。`,
    `续费判断：${user.renewal.fit}，路径为${user.renewal.path}。`,
  ];
  const taskRows = supportPlan.map((task, index) => ({
    key: `${user.id}-${index}`,
    step: index + 1,
    task,
    owner: index === 0 ? decision.owner : ["班主任", "教务", "顾问", "升学规划"][index] || decision.owner,
    timing: ["立即", "24小时内", "48小时内", "7天内"][index] || "持续跟进",
  }));
  return { thinking, conclusion, evidence, taskRows, decision };
}

function LearningAgentPage({ go }) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState(null);
  const quickQuestions = [
    ["智能问答", "张三同学最近的学情总结"],
    ["客诉分析", "林子涵同学最近是否有客诉风险？"],
    ["续费建议", "陈思远同学适合推荐哪些产品？"],
    ["角色分工", "周亦然同学现在各角色应该做什么？"],
    ["学习支持", "林子涵同学需要哪些学习支持？"],
    ["画像匹配", "哪些学生接近10W+用户画像？"],
  ];

  function askAgent(nextQuestion = question) {
    const finalQuestion = nextQuestion.trim() || "这个学生最近的学情如何，需要做哪些支持？";
    const mentionedUser = users.find((item) => finalQuestion.includes(item.name));
    const targetUser = mentionedUser || users[2];
    setQuestion(finalQuestion);
    setConversation({
      question: finalQuestion,
      user: targetUser,
      answer: buildAgentAnswer(targetUser, finalQuestion),
    });
  }

  return (
    <div className={conversation ? "agent-shell agent-shell-chat" : "agent-shell"}>
      {!conversation ? (
        <div className="agent-panel">
          <div className="agent-welcome">
            <Space align="center" size={10} className="agent-title-row">
              <RobotOutlined className="agent-title-icon" />
              <Title level={2}>我是学情Agent，很高兴为您服务</Title>
            </Space>
            <Text className="agent-subtitle" type="secondary">可查询学生学情、客诉风险、续费建议和角色分工</Text>
          </div>
          <div className="agent-main-input">
            <TextArea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="有问题，尽管问~"
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  askAgent();
                }
              }}
            />
            <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={() => askAgent()} />
          </div>
          <Space size={[8, 8]} wrap className="agent-mode-row">
            {quickQuestions.map(([label, prompt]) => (
              <Button key={label} onClick={() => askAgent(prompt)}>{label}</Button>
            ))}
          </Space>
        </div>
      ) : (
        <div className="agent-chat">
          <div className="agent-chat-top">
            <Title level={4}>{conversation.question}</Title>
            <Space wrap>
              <Button onClick={() => setConversation(null)}>新会话</Button>
              <Button onClick={() => go("students")}>学生档案</Button>
              <Button type="primary" onClick={() => go("profile", conversation.user.id)}>查看学生详情</Button>
            </Space>
          </div>
          <div className="agent-message-list">
            <div className="agent-bubble user-bubble">{conversation.question}</div>
            <div className="agent-answer">
              <Paragraph strong>{conversation.answer.conclusion}</Paragraph>
              <Paragraph>
                已结合该学生的企微沟通、课程进度、作业/模考、订单、客诉记录和10W+画像进行分析。当前建议先按
                <Text strong> {conversation.answer.decision.status} </Text>
                处理，由<Text strong> {conversation.answer.decision.owner} </Text>牵头推进。
              </Paragraph>
              <Title level={5}>建议动作</Title>
              <List
                size="small"
                dataSource={conversation.answer.taskRows}
                renderItem={(item) => <List.Item><Tag color="blue">{item.timing}</Tag>{item.owner}：{item.task}</List.Item>}
              />
              <Title level={5}>关键依据</Title>
              <List
                size="small"
                dataSource={conversation.answer.evidence}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </div>
          </div>
          <div className="agent-compose-card">
            <Space size={[8, 8]} wrap className="agent-mode-row">
              {quickQuestions.map(([label, prompt]) => (
                <Button key={label} onClick={() => askAgent(prompt)}>{label}</Button>
              ))}
            </Space>
            <div className="agent-main-input agent-chat-input">
              <TextArea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder="有问题，尽管问~"
              />
              <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={() => askAgent()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const servicePlanStorageKey = "student-service-plans-v1";

function ServicePlanDrawer({ student, onClose }) {
  const { message, modal } = AntApp.useApp();
  const [year, setYear] = useState(new Date().getFullYear());
  const [view, setView] = useState("grid");
  const [plans, setPlans] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(servicePlanStorageKey) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  });
  const getEntry = (selectedYear, selectedMonth) => plans[student.id]?.[`${selectedYear}-${selectedMonth}`] || {};
  const getSavedItems = (month) => getServicePlanItems(getEntry(year, month), `${student.id}-${year}-${month}-legacy`);
  const [drafts, setDrafts] = useState({});
  const changedMonths = Object.keys(drafts).filter((month) => {
    return JSON.stringify(drafts[month]) !== JSON.stringify(getSavedItems(month));
  });
  const dirty = changedMonths.length > 0;
  const getMonthItems = (month) => drafts[month] || getSavedItems(month);
  function updateMonthItems(month, update) {
    setDrafts((current) => ({ ...current, [month]: update(current[month] || getSavedItems(month)) }));
  }
  function addPlan(month) {
    const id = crypto.randomUUID();
    updateMonthItems(month, (items) => [...items, { id, text: "" }]);
  }
  function editPlan(month, id, text) {
    updateMonthItems(month, (items) => items.map((item) => item.id === id ? { ...item, text } : item));
  }
  function removePlan(month, id) {
    updateMonthItems(month, (items) => items.filter((item) => item.id !== id));
  }

  function leaveEditor(action) {
    if (!dirty) return action();
    modal.confirm({
      title: "服务计划有未保存的修改",
      content: "离开后将放弃这些修改。",
      okText: "放弃修改",
      cancelText: "继续编辑",
      onOk: action,
    });
  }

  function selectYear(nextYear) {
    leaveEditor(() => {
      setYear(nextYear);
      setDrafts({});
    });
  }

  function savePlan() {
    try {
      const latest = JSON.parse(localStorage.getItem(servicePlanStorageKey) || "{}");
      if (!latest || typeof latest !== "object" || Array.isArray(latest)) throw new Error("Invalid service plan storage");
      const entries = Object.fromEntries(changedMonths.map((month) => [
        `${year}-${month}`,
        { ...latest[student.id]?.[`${year}-${month}`], items: serializeServicePlanItems(drafts[month]), updatedAt: new Date().toISOString() },
      ]));
      const next = { ...latest, [student.id]: { ...latest[student.id], ...entries } };
      localStorage.setItem(servicePlanStorageKey, JSON.stringify(next));
      setPlans(next);
      setDrafts({});
      message.success(`已保存${year}年${changedMonths.length}个月的服务计划`);
    } catch {
      message.error("保存失败，请检查浏览器存储后重试。当前编辑内容已保留。 ");
    }
  }

  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const populatedMonths = months.filter((month) => getMonthItems(month).some((item) => item.text.trim())).length;
  const totalPlans = months.reduce((total, month) => total + getMonthItems(month).length, 0);
  const timelineRowCount = Math.max(1, ...months.map((month) => getMonthItems(month).length));
  function renderPlan(month, item, index) {
    return (
      <div key={item.id} className="service-plan-item">
        <div className="service-plan-item-heading">
          <label htmlFor={`service-plan-${item.id}`}>计划 {index + 1}</label>
          <Tooltip title="删除计划"><Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label={`删除${month}月计划${index + 1}`} onClick={() => removePlan(month, item.id)} /></Tooltip>
        </div>
        <TextArea id={`service-plan-${item.id}`} rows={3} maxLength={5000} value={item.text} onChange={(event) => editPlan(month, item.id, event.target.value)} placeholder="填写跟进计划" />
      </div>
    );
  }
  function renderMonthHeading(month) {
    const isCurrent = year === new Date().getFullYear() && month === new Date().getMonth() + 1;
    return <span className="service-month-heading"><strong>{month}月</strong>{isCurrent && <Tag color="blue">本月</Tag>}</span>;
  }
  return (
    <Drawer
      title={`${student.studentName} · 服务计划`}
      open
      width={view === "timeline" ? 1120 : 800}
      onClose={() => leaveEditor(onClose)}
      footer={<Space className="service-plan-footer">{dirty && <Text type="secondary">{changedMonths.length}个月待保存</Text>}<Button onClick={() => leaveEditor(onClose)}>关闭</Button><Button type="primary" onClick={savePlan} disabled={!dirty}>保存修改</Button></Space>}
    >
      <div className="service-plan-toolbar">
        <Space>
          <Button icon={<LeftOutlined />} title="上一年" aria-label="上一年" disabled={year <= 2000} onClick={() => selectYear(year - 1)} />
          <InputNumber aria-label="计划年份" min={2000} max={2100} precision={0} value={year} onChange={(value) => { if (Number.isInteger(value) && value >= 2000 && value <= 2100 && value !== year) selectYear(value); }} />
          <Text>年</Text>
          <Button icon={<RightOutlined />} title="下一年" aria-label="下一年" disabled={year >= 2100} onClick={() => selectYear(year + 1)} />
        </Space>
        <Segmented aria-label="服务计划展示方式" value={view} onChange={setView} options={[
          { value: "grid", label: "宫格", icon: <AppstoreOutlined /> },
          { value: "timeline", label: "时间轴", icon: <BarsOutlined /> },
        ]} />
      </div>
      <div className="service-plan-summary"><Text type="secondary">已记录 {populatedMonths}/12 个月 · 共 {totalPlans} 条计划</Text></div>
      {view === "grid" ? (
        <div className="service-month-grid">
          {months.map((month) => (
            <section key={month} className="service-month-cell" aria-label={`${year}年${month}月服务计划`}>
              {renderMonthHeading(month)}
              {getMonthItems(month).map((item, index) => renderPlan(month, item, index))}
              <Button className="service-plan-add" type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addPlan(month)}>新增计划</Button>
              {changedMonths.includes(String(month)) && <span className="service-month-status">未保存</span>}
            </section>
          ))}
        </div>
      ) : (
        <div className="service-timeline-scroll" tabIndex={0} role="region" aria-label="月度服务计划时间轴">
          <table className="service-timeline-table">
            <thead><tr><th scope="col" className="service-timeline-label">计划</th>{months.map((month) => <th scope="col" key={month}>{renderMonthHeading(month)}{changedMonths.includes(String(month)) && <span className="service-month-status">未保存</span>}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: timelineRowCount }, (_, index) => (
                <tr key={index}><th scope="row" className="service-timeline-label">{index + 1}</th>{months.map((month) => {
                  const item = getMonthItems(month)[index];
                  return <td key={month}>{item && renderPlan(month, item, index)}</td>;
                })}</tr>
              ))}
              <tr><th className="service-timeline-label" />{months.map((month) => <td key={month}><Button type="dashed" size="small" block icon={<PlusOutlined />} onClick={() => addPlan(month)}>新增计划</Button></td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
    </Drawer>
  );
}

const archiveNotesStorageKey = "studentArchive.notes.v1";
const archiveCustomFieldsStorageKey = "studentArchive.customFields.v1";
const editableArchiveFieldKeys = ["riskNotes", "latestFollowUp", "targetSchool", "targetMajor", "courseSelection", "subjectTargetScore", "subjectCurrentStatus"];
const richArchiveFieldKeys = ["riskNotes", "latestFollowUp"];
const archiveTextColors = [
  ["默认", "#344054"], ["红色", "#cf1322"], ["橙色", "#ad4e00"], ["绿色", "#237804"], ["蓝色", "#0958d9"],
];
const archiveBubbleMenuOptions = { strategy: "fixed", placement: "top", offset: 8, flip: true, shift: { padding: 8 } };
const appendArchiveBubbleMenu = () => window.document.body;
const showArchiveBubbleMenu = ({ editor, from, to }) => editor.isEditable && editor.isFocused && !editor.state.selection.empty && editor.state.doc.textBetween(from, to).length > 0;

function archiveTextDocument(value) {
  return { type: "doc", content: String(value || "").split("\n").map((text) => ({
    type: "paragraph", ...(text ? { content: [{ type: "text", text }] } : {}),
  })) };
}

function ArchiveRichTextCell({ value, document, label, onSave }) {
  const [editing, setEditing] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: document || archiveTextDocument(value),
    editable: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { "aria-label": label } },
  });
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editing);
    if (editing) editor.commands.focus();
    else editor.commands.setContent(document || archiveTextDocument(value), { emitUpdate: false });
  }, [editor, editing, value, document]);
  if (!editor) return null;
  return (
    <div className={`archive-rich-cell${editing ? " is-editing" : ""}`}>
      {editing && (
        <BubbleMenu
          editor={editor}
          style={{ zIndex: 1100 }}
          appendTo={appendArchiveBubbleMenu}
          options={archiveBubbleMenuOptions}
          shouldShow={showArchiveBubbleMenu}
        >
        <div className="archive-rich-toolbar" role="toolbar" aria-label={`${label}格式`} onMouseDown={(event) => event.preventDefault()}>
          <Tooltip title="加粗"><Button size="small" type={editor.isActive("bold") ? "primary" : "text"} icon={<BoldOutlined />} aria-label="加粗" aria-pressed={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} /></Tooltip>
          {archiveTextColors.map(([name, color]) => (
            <Tooltip title={`${name}字体`} key={color}>
              <button type="button" className="archive-color-swatch" aria-label={`${name}字体`} aria-pressed={editor.isActive("textStyle", { color })} style={{ backgroundColor: color }} onClick={() => editor.chain().focus().setColor(color).run()} />
            </Tooltip>
          ))}
        </div>
        </BubbleMenu>
      )}
      <div
        className="archive-rich-content"
        role={editing ? undefined : "button"}
        tabIndex={editing ? undefined : 0}
        aria-label={editing ? undefined : `编辑${label}`}
        onClick={() => { if (!editing) setEditing(true); }}
        onKeyDown={(event) => { if (!editing && ["Enter", " "].includes(event.key)) { event.preventDefault(); setEditing(true); } }}
      >
        {!editing && !value ? <span>未填写</span> : <EditorContent editor={editor} />}
      </div>
      {editing ? (
        <Space size={4} className="archive-rich-actions">
          <Tooltip title="保存"><Button size="small" type="primary" icon={<SaveOutlined />} aria-label={`保存${label}`} onClick={() => { if (onSave(editor.getText({ blockSeparator: "\n" }), editor.getJSON())) setEditing(false); }} /></Tooltip>
          <Tooltip title="取消"><Button size="small" icon={<CloseOutlined />} aria-label={`取消编辑${label}`} onClick={() => setEditing(false)} /></Tooltip>
        </Space>
      ) : <Tooltip title={`编辑${label}`}><Button type="text" size="small" icon={<EditOutlined />} aria-label={`编辑${label}`} onClick={() => setEditing(true)} /></Tooltip>}
    </div>
  );
}

function ArchiveEditableCell({ value, label, onSave, requiresConfirmation = false }) {
  const { modal } = AntApp.useApp();
  const [editing, setEditing] = useState(false);
  function submitEdit(nextValue) {
    if (nextValue === (value || "")) {
      setEditing(false);
      return;
    }
    if (!requiresConfirmation) {
      if (onSave(nextValue)) setEditing(false);
      return;
    }
    modal.confirm({
      title: `确认修改${label}？`,
      content: (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="修改前"><span className="archive-editable-text">{archiveFallback(value)}</span></Descriptions.Item>
          <Descriptions.Item label="修改后"><span className="archive-editable-text">{archiveFallback(nextValue)}</span></Descriptions.Item>
        </Descriptions>
      ),
      okText: "确认修改",
      cancelText: "取消",
      onOk: () => {
        if (onSave(nextValue)) setEditing(false);
        else return Promise.reject(new Error("Archive field save failed"));
      },
    });
  }
  return (
    <Text className="archive-editable-text" editable={{
      editing,
      text: value || "",
      triggerType: ["text", "icon"],
      tooltip: `编辑${label}`,
      autoSize: { minRows: 2 },
      onStart: () => setEditing(true),
      onCancel: () => setEditing(false),
      onChange: submitEdit,
    }}>{archiveFallback(value)}</Text>
  );
}

function ArchiveRemarkCell({ children, remark, label, studentName, onSave, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const navigationTimer = useRef(null);
  const cellRef = useRef(null);
  const popoverRef = useRef(null);
  useEffect(() => () => clearTimeout(navigationTimer.current), []);
  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event) {
      if (!cellRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false);
    }
    window.document.addEventListener("mousedown", closeOnOutsideClick);
    return () => window.document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);
  function openRemark(edit) {
    clearTimeout(navigationTimer.current);
    setDraft(remark || "");
    setEditing(edit);
    setOpen(true);
  }
  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => { if (nextOpen) openRemark(false); else setOpen(false); }}
      trigger={[]}
      title={`${studentName} · ${label}备注`}
      content={(
        <div ref={popoverRef} className="archive-remark-popover">
          {editing ? (
            <>
              <TextArea aria-label={`${label}备注`} autoFocus rows={4} maxLength={2000} showCount value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="填写备注" />
              <Space className="archive-remark-actions">
                <Button size="small" onClick={() => { setDraft(remark || ""); if (remark) setEditing(false); else setOpen(false); }}>取消</Button>
                <Button size="small" type="primary" onClick={() => { if (onSave(draft.trim())) setOpen(false); }}>保存</Button>
              </Space>
            </>
          ) : (
            <>
              <div className="archive-remark-text">{remark}</div>
              <Button size="small" icon={<EditOutlined />} onClick={() => { setDraft(remark || ""); setEditing(true); }}>编辑备注</Button>
            </>
          )}
        </div>
      )}
    >
      <div ref={cellRef} className="archive-remark-cell" onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); openRemark(true); }}>
        {onNavigate ? <Button type="link" onClick={(event) => {
          event.stopPropagation();
          clearTimeout(navigationTimer.current);
          if (event.detail < 2) navigationTimer.current = setTimeout(onNavigate, 350);
        }}>{children}</Button> : <span className="archive-remark-value">{children}</span>}
        {remark && <Tooltip title={<span className="archive-remark-preview">{remark}</span>}><Button className="archive-remark-icon" size="small" type="text" icon={<CommentOutlined />} aria-label={`查看${label}备注`} onClick={(event) => { event.stopPropagation(); openRemark(false); }} /></Tooltip>}
      </div>
    </Popover>
  );
}

function SortableArchiveField({ field, index, total, onMove, checked, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key });
  return (
    <div ref={setNodeRef} className="archive-field-order-row" style={{ transform: CSS.Transform.toString(transform), transition, position: "relative", zIndex: isDragging ? 1 : undefined }}>
      <Checkbox checked={checked} onChange={(event) => onToggle(event.target.checked)} aria-label={`展示${field.title}`} />
      <Button type="text" size="small" icon={<HolderOutlined />} aria-label={`拖动${field.title}`} className="archive-field-drag" {...attributes} {...listeners} />
      <span className="archive-field-order-index">{index + 2}</span>
      <span className="archive-field-order-title">{field.title}</span>
      {field.custom && <Tag color="blue">自定义</Tag>}
      <Tooltip title="上移"><Button size="small" type="text" icon={<ArrowUpOutlined />} aria-label={`上移${field.title}`} disabled={index === 0} onClick={() => onMove(index, index - 1)} /></Tooltip>
      <Tooltip title="下移"><Button size="small" type="text" icon={<ArrowDownOutlined />} aria-label={`下移${field.title}`} disabled={index === total - 1} onClick={() => onMove(index, index + 1)} /></Tooltip>
      {field.custom && <Tooltip title="删除字段"><Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label={`删除自定义字段${field.title}`} onClick={() => onDelete(field)} /></Tooltip>}
    </div>
  );
}

function ArchiveColumnFilter({ field, rows, filter, onApply, onClose }) {
  const [draft, setDraft] = useState(filter || {});
  const [error, setError] = useState("");
  const type = archiveFilterType(field.key);
  const update = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setError(""); };
  const options = [...new Set(rows.flatMap((row) => archiveEnumValues(row[field.key], field.key)))].sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true }));
  return (
    <div className="archive-column-filter" onKeyDown={(event) => event.stopPropagation()}>
      <Text strong>{field.title}</Text>
      <Select aria-label={`${field.title}填写状态`} className="full-width" value={draft.presence || ""} onChange={(value) => update("presence", value)} options={[{ value: "", label: "全部填写状态" }, { value: "filled", label: "已填写" }, { value: "empty", label: "未填写" }]} />
      {type === "enum" && <Select aria-label={`${field.title}筛选值`} mode="multiple" showSearch allowClear className="full-width" placeholder="选择筛选值" value={draft.values || []} onChange={(value) => update("values", value)} options={options.map((value) => ({ value, label: value }))} />}
      {type === "text" && <Input aria-label={`${field.title}关键词`} allowClear value={draft.keyword || ""} onChange={(event) => update("keyword", event.target.value)} placeholder="输入关键词" />}
      {type === "number" && <Space><InputNumber aria-label="最少课时" min={0} value={draft.min} onChange={(value) => update("min", value)} placeholder="最少课时" /><Text>至</Text><InputNumber aria-label="最多课时" min={0} value={draft.max} onChange={(value) => update("max", value)} placeholder="最多课时" /></Space>}
      {type === "date" && <><Input type="date" aria-label="开始日期" value={draft.start || ""} onChange={(event) => update("start", event.target.value)} /><Input type="date" aria-label="结束日期" value={draft.end || ""} onChange={(event) => update("end", event.target.value)} /></>}
      {error && <Text type="danger">{error}</Text>}
      <Space className="archive-column-filter-actions">
        <Button size="small" onClick={() => { onApply({}); onClose(); }}>重置</Button>
        <Button size="small" onClick={onClose}>取消</Button>
        <Button size="small" type="primary" onClick={() => {
          if ((draft.min != null && draft.max != null && draft.min > draft.max) || (draft.start && draft.end && draft.start > draft.end)) return setError("起始值不能大于结束值");
          onApply(draft); onClose();
        }}>确定</Button>
      </Space>
    </div>
  );
}

function StudentsArchivePage({ go }) {
  const { message, modal } = AntApp.useApp();
  const [customFields, setCustomFields] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(archiveCustomFieldsStorageKey) || "[]");
      if (!Array.isArray(saved)) return [];
      const keys = new Set();
      const titles = new Set(standardArchiveFields.map((field) => field.title.toLocaleLowerCase()));
      return saved.filter((field) => {
        if (!field || typeof field.key !== "string" || !field.key.startsWith("custom_") || typeof field.title !== "string" || !field.title.trim() || keys.has(field.key) || titles.has(field.title.trim().toLocaleLowerCase())) return false;
        keys.add(field.key); titles.add(field.title.trim().toLocaleLowerCase()); return true;
      }).slice(0, 5).map((field) => ({ key: field.key, title: field.title.trim(), width: 200, custom: true }));
    } catch { return []; }
  });
  const archiveFields = [...standardArchiveFields, ...customFields];
  const [draftCustomFields, setDraftCustomFields] = useState(customFields);
  const draftArchiveFields = [...standardArchiveFields, ...draftCustomFields];
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldError, setNewFieldError] = useState("");
  const [archiveNotes, setArchiveNotes] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(archiveNotesStorageKey) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  });
  const archiveRows = standardArchiveRows.map((row) => {
    const notes = archiveNotes[row.id];
    return { ...row, ...Object.fromEntries(richArchiveFieldKeys.map((key) => [`${key}Document`, notes?.[`${key}Document`]])), ...Object.fromEntries([...editableArchiveFieldKeys, ...customFields.map((field) => field.key)].map((key) => [
      key, typeof notes?.[key] === "string" ? notes[key] : row[key],
    ])) };
  });
  function saveArchiveNote(id, field, value, document) {
    try {
      const latest = JSON.parse(localStorage.getItem(archiveNotesStorageKey) || "{}");
      if (!latest || typeof latest !== "object" || Array.isArray(latest)) throw new Error("Invalid archive notes storage");
      const next = { ...latest, [id]: { ...latest[id], [field]: value, ...(document ? { [`${field}Document`]: document } : {}) } };
      localStorage.setItem(archiveNotesStorageKey, JSON.stringify(next));
      setArchiveNotes(next);
      message.success("已保存");
      return true;
    } catch {
      message.error("保存失败，请重试");
      return false;
    }
  }
  const [servicePlanStudent, setServicePlanStudent] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState(null);
  const [filterPopupVersion, setFilterPopupVersion] = useState(0);
  const [tablePage, setTablePage] = useState(1);
  const [source, setSource] = useState("全部");
  const [country, setCountry] = useState("全部");
  const [system, setSystem] = useState("全部");
  const [product, setProduct] = useState("全部");
  const [planning, setPlanning] = useState("全部");
  const [advisor, setAdvisor] = useState("全部");
  const [homeroomTeacher, setHomeroomTeacher] = useState("全部");
  const [fieldDrawerOpen, setFieldDrawerOpen] = useState(false);
  const [visibleFieldKeys, setVisibleFieldKeys] = useState(() => {
    if (typeof window === "undefined") return defaultArchiveFieldKeys;
    try {
      const saved = JSON.parse(window.localStorage.getItem(archiveFieldStorageKey) || "[]");
      const validKeys = saved.filter((key) => archiveFields.some((field) => field.key === key));
      return validKeys.length ? [...new Set([...requiredArchiveFieldKeys, ...validKeys])] : [...defaultArchiveFieldKeys, ...customFields.map((field) => field.key)];
    } catch {
      return defaultArchiveFieldKeys;
    }
  });
  const [draftFieldKeys, setDraftFieldKeys] = useState(visibleFieldKeys);
  const [draftFieldOrder, setDraftFieldOrder] = useState(() => getFieldOrder());
  function getFieldOrder() {
    let saved = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(`${archiveFieldStorageKey}.order`) || "[]");
      if (Array.isArray(parsed)) saved = parsed;
    } catch { /* Fall back to the current displayed order. */ }
    return [...new Set([...requiredArchiveFieldKeys, ...(saved.length ? saved : visibleFieldKeys), ...archiveFields.map((field) => field.key)])]
      .filter((key) => archiveFields.some((field) => field.key === key));
  }
  const fieldSortSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const sortableFieldKeys = draftFieldOrder.filter((key) => !requiredArchiveFieldKeys.includes(key));
  function moveArchiveField(from, to) {
    if (from < 0 || to < 0 || from >= sortableFieldKeys.length || to >= sortableFieldKeys.length) return;
    setDraftFieldOrder([...requiredArchiveFieldKeys, ...arrayMove(sortableFieldKeys, from, to)]);
  }
  function addCustomField() {
    const title = newFieldName.trim();
    if (draftCustomFields.length >= 5) return setNewFieldError("最多支持5个自定义字段");
    if (!title) return setNewFieldError("请输入字段名称");
    if (title.length > 20) return setNewFieldError("字段名称最多20个字");
    if (title === "操作" || draftArchiveFields.some((field) => field.title.toLocaleLowerCase() === title.toLocaleLowerCase())) return setNewFieldError("字段名称已存在，请使用其他名称");
    const field = { key: `custom_${crypto.randomUUID()}`, title, width: 200, custom: true };
    setDraftCustomFields((current) => [...current, field]);
    setDraftFieldKeys((current) => [...current, field.key]);
    setDraftFieldOrder((current) => [...current, field.key]);
    setNewFieldName(""); setNewFieldError("");
  }
  function deleteCustomField(field) {
    if (!field.custom) return;
    modal.confirm({
      title: `删除自定义字段“${field.title}”？`,
      content: "该字段将从配置列表和学生表格中移除，保存字段配置后生效。",
      okText: "删除字段",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: () => {
        setDraftCustomFields((current) => current.filter((item) => item.key !== field.key));
        setDraftFieldKeys((current) => current.filter((key) => key !== field.key));
        setDraftFieldOrder((current) => current.filter((key) => key !== field.key));
        setNewFieldError("");
      },
    });
  }
  const filteredRows = archiveRows.filter((item) => {
    const searchableFields = archiveFields.map((field) => field.key);
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();
    const keywordHit = !normalizedKeyword || searchableFields.some((field) => String(item[field] ?? "").toLocaleLowerCase().includes(normalizedKeyword));
    const sourceHit = source === "全部" || item.source === source;
    const countryHit = country === "全部" || String(item.targetCountry || "").includes(country);
    const systemHit = system === "全部" || item.system === system;
    const planningHit = planning === "全部" || item.hasPlanning === planning;
    const advisorHit = advisor === "全部" || item.advisor === advisor;
    const homeroomHit = homeroomTeacher === "全部" || item.homeroomTeacher === homeroomTeacher;
    const productHit = product === "全部"
      || (product === "报名学科" && item.enrolledSubject === "是")
      || (product === "报名语培" && String(item.enrolledLanguage || "").includes("是"))
      || (product === "报名规划" && item.hasPlanning === "是");
    return keywordHit && sourceHit && countryHit && systemHit && planningHit && advisorHit && homeroomHit && productHit
      && Object.entries(columnFilters).every(([key, filter]) => matchesArchiveFilter(item[key], key, filter));
  });
  if (sortConfig) filteredRows.sort((a, b) => compareArchiveRows(a, b, sortConfig.key, sortConfig.order));
  useEffect(() => { setTablePage(1); }, [keyword, source, country, system, product, planning, advisor, homeroomTeacher, columnFilters]);
  function applyColumnFilter(key, filter) {
    setColumnFilters((current) => {
      const next = { ...current };
      if (hasArchiveFilter(filter)) next[key] = filter;
      else delete next[key];
      return next;
    });
  }
  const sourceOptions = getArchiveOptions(standardArchiveRows, "source");
  const countryOptions = getArchiveOptions(standardArchiveRows, "targetCountry");
  const systemOptions = getArchiveOptions(standardArchiveRows, "system");
  const planningOptions = getArchiveOptions(standardArchiveRows, "hasPlanning");
  const advisorOptions = getArchiveOptions(standardArchiveRows, "advisor");
  const homeroomOptions = getArchiveOptions(standardArchiveRows, "homeroomTeacher");
  const columns = visibleFieldKeys
    .map((key) => archiveFields.find((field) => field.key === key))
    .filter(Boolean)
    .map((field) => ({
      title: field.title,
      dataIndex: field.key,
      fixed: field.key === "studentName" ? "left" : undefined,
      width: ["riskNotes", "latestFollowUp"].includes(field.key) ? 260 : Math.max(140, field.width || 160),
      key: field.key,
      sorter: isArchiveSortable(field.key) || undefined,
      sortOrder: sortConfig?.key === field.key ? sortConfig.order : null,
      filteredValue: columnFilters[field.key] ? [JSON.stringify(columnFilters[field.key])] : null,
      filterIcon: (filtered) => <FilterOutlined style={{ color: filtered ? "#1b63d9" : undefined }} />,
      filterDropdownProps: { onOpenChange: (open) => { if (open) setFilterPopupVersion((current) => current + 1); } },
      filterDropdown: ({ close }) => <ArchiveColumnFilter key={`${field.key}-${filterPopupVersion}`} field={field} rows={archiveRows} filter={columnFilters[field.key]} onApply={(filter) => applyColumnFilter(field.key, filter)} onClose={close} />,
      render: (_, record) => {
        if (richArchiveFieldKeys.includes(field.key)) {
          return <ArchiveRichTextCell value={record[field.key]} document={record[`${field.key}Document`]} label={field.title} onSave={(value, document) => saveArchiveNote(record.id, field.key, value, document)} />;
        }
        if (field.custom || editableArchiveFieldKeys.includes(field.key)) {
          return <ArchiveEditableCell value={record[field.key]} label={field.title} requiresConfirmation={["targetMajor", "courseSelection"].includes(field.key)} onSave={(value) => saveArchiveNote(record.id, field.key, value)} />;
        }
        const remark = archiveNotes[record.id]?.[`${field.key}Remark`];
        return <ArchiveRemarkCell
          remark={typeof remark === "string" ? remark : ""}
          label={field.title}
          studentName={record.studentName}
          onSave={(value) => saveArchiveNote(record.id, `${field.key}Remark`, value)}
          onNavigate={field.key === "studentName" ? () => go("profile", record.linkedUserId) : undefined}
        >{getArchiveDisplayValue(record, field.key)}</ArchiveRemarkCell>;
      },
    }));
  columns.push(
    {
      title: "操作",
      key: "operation",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Button size="small" icon={<CalendarOutlined />} onClick={() => setServicePlanStudent(record)}>服务计划</Button>
      ),
    },
  );

  function resetFilters() {
    setColumnFilters({});
    setSortConfig(null);
    setKeyword("");
    setSource("全部");
    setCountry("全部");
    setSystem("全部");
    setProduct("全部");
    setPlanning("全部");
    setAdvisor("全部");
    setHomeroomTeacher("全部");
  }

  function openFieldDrawer() {
    setDraftFieldKeys(visibleFieldKeys);
    setDraftCustomFields(customFields);
    setNewFieldName(""); setNewFieldError("");
    setDraftFieldOrder(getFieldOrder());
    setFieldDrawerOpen(true);
  }

  function saveFieldConfig() {
    const nextKeys = [...new Set([...requiredArchiveFieldKeys, ...draftFieldOrder.filter((key) => draftFieldKeys.includes(key))])];
    try {
      window.localStorage.setItem(archiveCustomFieldsStorageKey, JSON.stringify(draftCustomFields));
      window.localStorage.setItem(`${archiveFieldStorageKey}.order`, JSON.stringify(draftFieldOrder));
      window.localStorage.setItem(archiveFieldStorageKey, JSON.stringify(nextKeys));
      setVisibleFieldKeys(nextKeys);
      setCustomFields(draftCustomFields);
      const validKeys = new Set(draftArchiveFields.map((field) => field.key));
      setColumnFilters((current) => Object.fromEntries(Object.entries(current).filter(([key]) => validKeys.has(key))));
      if (sortConfig && !validKeys.has(sortConfig.key)) setSortConfig(null);
      setFieldDrawerOpen(false);
      message.success("字段配置已保存");
    } catch {
      message.error("字段配置保存失败，请重试");
    }
  }

  return (
    <Row gutter={[16, 16]} className="high-value-page">
      <Col span={24}>
        <Card
          title="学生档案"
          extra={(
            <Space wrap>
              <Button type="primary" onClick={() => go("agent")}>问学情Agent</Button>
              <Button icon={<SettingOutlined />} onClick={openFieldDrawer}>字段配置</Button>
            </Space>
          )}
        >
          <Row gutter={[12, 12]} className="student-filter-row">
            <Col xs={24} lg={8}>
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索姓名、学校、负责人、目标、风险或跟进记录" />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={source} onChange={setSource} options={sourceOptions.map((item) => ({ ...item, label: `来源：${item.label}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={country} onChange={setCountry} options={countryOptions.map((item) => ({ ...item, label: `目标：${item.label}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={system} onChange={setSystem} options={systemOptions.map((item) => ({ ...item, label: `体系：${item.label}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={product} onChange={setProduct} options={["全部", "报名学科", "报名语培", "报名规划"].map((item) => ({ value: item, label: `产品：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={planning} onChange={setPlanning} options={planningOptions.map((item) => ({ ...item, label: `规划：${item.label}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={advisor} onChange={setAdvisor} options={advisorOptions.map((item) => ({ ...item, label: `顾问：${item.label}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={homeroomTeacher} onChange={setHomeroomTeacher} options={homeroomOptions.map((item) => ({ ...item, label: `班主任：${item.label}` }))} />
            </Col>
            <Col xs={24} lg={6}>
              <Space wrap>
                <Button onClick={resetFilters}>重置</Button>
              </Space>
            </Col>
          </Row>
          <div className="archive-active-filters">
            <Space size={[8, 8]} wrap>
              {keyword.trim() && <Tag closable onClose={() => setKeyword("")}>搜索：{keyword.trim()}</Tag>}
              {[["来源", source, setSource], ["目标", country, setCountry], ["体系", system, setSystem], ["产品", product, setProduct], ["规划", planning, setPlanning], ["顾问", advisor, setAdvisor], ["班主任", homeroomTeacher, setHomeroomTeacher]].filter(([, value]) => value !== "全部").map(([label, value, setter]) => <Tag key={label} closable onClose={() => setter("全部")}>{label}：{value}</Tag>)}
              {Object.entries(columnFilters).map(([key, filter]) => {
                const label = archiveFields.find((field) => field.key === key)?.title;
                const summary = [filter.presence === "filled" ? "已填写" : filter.presence === "empty" ? "未填写" : "", filter.values?.join("、"), filter.keyword?.trim(), filter.min != null || filter.max != null ? `${filter.min ?? "不限"}—${filter.max ?? "不限"}` : "", filter.start || filter.end ? `${filter.start || "不限"} 至 ${filter.end || "不限"}` : ""].filter(Boolean).join(" · ");
                return <Tag key={key} closable onClose={() => applyColumnFilter(key, {})}>{label}：{summary}</Tag>;
              })}
              {sortConfig && <Tag closable onClose={() => setSortConfig(null)}>{standardArchiveFields.find((field) => field.key === sortConfig.key)?.title}：{sortConfig.order === "ascend" ? "升序" : "降序"}</Tag>}
            </Space>
          </div>
          <div className="archive-table-summary">
            <Space size={[8, 8]} wrap>
              <Tag>标准字段 {standardArchiveFields.length} 个</Tag>
              {customFields.length > 0 && <Tag>自定义字段 {customFields.length} 个</Tag>}
              <Tag>当前展示 {visibleFieldKeys.length + 1} 列</Tag>
              <Tag>档案 {filteredRows.length}/{standardArchiveRows.length} 条</Tag>
            </Space>
          </div>
          <Table
            rowKey="id"
            tableLayout="fixed"
            className="student-table"
            columns={columns}
            dataSource={filteredRows}
            pagination={{ current: tablePage, pageSize: 8, showSizeChanger: false }}
            onChange={(pagination, filters, sorter, extra) => {
              if (extra.action === "sort") {
                setSortConfig(sorter.order ? { key: sorter.columnKey, order: sorter.order } : null);
                setTablePage(1);
              } else if (extra.action === "paginate") setTablePage(pagination.current);
            }}
            scroll={{ x: Math.max(1280, columns.reduce((sum, column) => sum + (column.width || 140), 0)) }}
          />
          {servicePlanStudent && <ServicePlanDrawer key={servicePlanStudent.id} student={servicePlanStudent} onClose={() => setServicePlanStudent(null)} />}
          <Drawer
            title="配置学生档案展示字段"
            width={560}
            open={fieldDrawerOpen}
            onClose={() => setFieldDrawerOpen(false)}
            extra={(
              <Space>
                <Button onClick={() => { setDraftFieldKeys([...defaultArchiveFieldKeys, ...draftCustomFields.map((field) => field.key)]); setDraftFieldOrder(draftArchiveFields.map((field) => field.key)); }}>恢复默认</Button>
                <Button onClick={() => setDraftFieldKeys(draftArchiveFields.map((field) => field.key))}>全选</Button>
                <Button onClick={() => setDraftFieldKeys(requiredArchiveFieldKeys)}>清空可选</Button>
                <Button type="primary" onClick={saveFieldConfig}>保存</Button>
              </Space>
            )}
          >
            <Alert type="info" showIcon message="学生姓名和操作列固定展示；其他字段可按老师个人工作场景配置。" />
            <section className="archive-field-order">
              <Title level={5}>展示顺序</Title>
              <div className="archive-field-order-row"><Checkbox checked disabled aria-label="展示学生姓名" /><span className="archive-field-order-index">1</span><span className="archive-field-order-title">学生姓名</span><Tag>固定左侧</Tag></div>
              <DndContext sensors={fieldSortSensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id) moveArchiveField(sortableFieldKeys.indexOf(active.id), sortableFieldKeys.indexOf(over.id));
              }}>
                <SortableContext items={sortableFieldKeys} strategy={verticalListSortingStrategy}>
                  {sortableFieldKeys.map((key, index) => <SortableArchiveField key={key} field={draftArchiveFields.find((field) => field.key === key)} index={index} total={sortableFieldKeys.length} onMove={moveArchiveField} checked={draftFieldKeys.includes(key)} onDelete={deleteCustomField} onToggle={(checked) => setDraftFieldKeys((current) => checked ? [...new Set([...current, key])] : current.filter((item) => item !== key))} />)}
                </SortableContext>
              </DndContext>
              <div className="archive-field-order-row"><Checkbox checked disabled aria-label="展示操作" /><span className="archive-field-order-index">{draftFieldOrder.length + 1}</span><span className="archive-field-order-title">操作</span><Tag>固定右侧</Tag></div>
            </section>
            <section className="archive-custom-field-section">
              <div className="archive-custom-field-heading"><Text type="secondary">添加自定义字段</Text><Text type="secondary">{draftCustomFields.length}/5</Text></div>
              <Space.Compact className="full-width">
                <Input size="small" aria-label="自定义字段名称" value={newFieldName} maxLength={20} disabled={draftCustomFields.length >= 5} placeholder={draftCustomFields.length >= 5 ? "已达到5个自定义字段上限" : "输入字段名称"} onChange={(event) => { setNewFieldName(event.target.value); setNewFieldError(""); }} onPressEnter={addCustomField} />
                <Button size="small" icon={<PlusOutlined />} disabled={draftCustomFields.length >= 5} onClick={addCustomField}>新增字段</Button>
              </Space.Compact>
              {newFieldError && <Text type="danger">{newFieldError}</Text>}
            </section>
          </Drawer>
        </Card>
      </Col>
    </Row>
  );
}

function MetricRow() {
  return (
    <Row gutter={[16, 16]} className="metric-row">
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="接入数据源" value={8} suffix="类" /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="今日风险用户" value={2} suffix="人" valueStyle={{ color: "#cf1322" }} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="10W+画像匹配" value={1} suffix="人" valueStyle={{ color: "#1b63d9" }} /></Card></Col>
      <Col xs={24} sm={12} lg={6}><Card><Statistic title="可经营机会" value={15.6} suffix="万" precision={1} /></Card></Col>
    </Row>
  );
}

function CommandCenter({ go }) {
  const columns = [
    { title: "用户", dataIndex: "name", render: (_, record) => <Button type="link" onClick={() => go("profile", record.id)}>{record.name}</Button> },
    { title: "阶段", dataIndex: "stage" },
    { title: "客诉", dataIndex: "level", render: (level) => <RiskTag level={level} /> },
    { title: "消费", dataIndex: "spent" },
    { title: "机会", dataIndex: "chance" },
    { title: "10W+相似度", dataIndex: "value", render: (value) => <Progress percent={value} size="small" /> },
    { title: "下一步动作", dataIndex: "action" },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="架构链路总览" extra={<Button type="link" onClick={() => go("insights")}>查看洞察</Button>}>
          <Steps
            current={1}
            items={[
              { title: "学情信息来源", description: "多渠道采集" },
              { title: "学情提取与洞察", description: "Q&A / 作业 / 反馈 / 客诉" },
              { title: "客诉管理流程", description: "预警 / 定级 / 处理 / 复盘 / 回访" },
              { title: "10W+画像分析", description: "识别高价值路径" },
              { title: "AI续费管理", description: "续排课 / 同体系 / 扩体系" },
            ]}
            onChange={(index) => go(["sources", "insights", "complaint", "highValue", "renewal"][index])}
          />
        </Card>
      </Col>
      <Col xs={24} lg={16}>
        <Card title="用户经营队列">
          <Table rowKey="id" size="middle" columns={columns} dataSource={users} pagination={false} scroll={{ x: 960 }} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="今日预警">
          <List
            dataSource={[
              ["AI预警：刘思琪", "互动与作业轻微波动 · 今日核查触发原因", "u-009", "complaint"],
              ["黄色客诉：林子涵", "老师匹配与效果焦虑 · 24小时内首次闭环", "u-yellow", "complaint"],
              ["红色客诉：周亦然", "退费风险与品牌质疑 · 2小时内主管介入", "u-red", "complaint"],
              ["10W+画像匹配：陈思远", "规划转化与多产品组合 · 本周路径诊断", "u-high", "renewal"],
            ]}
            renderItem={(item) => (
              <List.Item actions={[<Button type="link" onClick={() => go(item[3], item[2])}>处理</Button>]}>
                <List.Item.Meta title={item[0]} description={item[1]} />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}

function SourcesPage({ go }) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Card title="学情信息来源" extra={<Button type="primary" onClick={() => go("insights")}>开始提取洞察</Button>}>
          <Row gutter={[12, 12]}>
            {sources.map(([name, desc, count, status]) => (
              <Col xs={24} md={12} key={name}>
                <Card size="small" className="source-card">
                  <Space direction="vertical" size={4}>
                    <Space><Badge status={status} /><Text strong>{name}</Text></Space>
                    <Text type="secondary">{desc}</Text>
                    <Tag color="blue">{count}</Tag>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="采集后处理">
          <Timeline
            items={[
              { children: "统一用户ID，合并企微、课程、订单和工作台数据。" },
              { children: "按时间线切片，识别关键服务节点和异常信号。" },
              { children: "抽取承诺、反馈、客诉、作业、模考和规划目标。" },
              { children: "进入学情洞察层，生成风险与机会标签。" },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}

function InsightsPage({ go }) {
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="学情信息提取与洞察">
          <Row gutter={[12, 12]}>
            {extractionItems.map(([name, desc, score]) => (
              <Col xs={24} md={12} xl={6} key={name}>
                <Card size="small">
                  <Space direction="vertical" className="full-width">
                    <Text strong>{name}</Text>
                    <Text type="secondary">{desc}</Text>
                    <Progress percent={score} />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="洞察结果样例">
          <List
            dataSource={[
              ["刘思琪：AI识别潜在客诉预警", "u-009"],
              ["林子涵：作业完成率下降，黄色风险", "u-yellow"],
              ["周亦然：退费关键词触发，红色风险", "u-red"],
              ["陈思远：10W+路径相似，推荐规划诊断", "u-high"],
            ]}
            renderItem={(item) => <List.Item actions={[<Button type="link" onClick={() => go("profile", item[1])}>查看</Button>]}>{item[0]}</List.Item>}
          />
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="AI洞察输出格式">
          <Space size={[8, 8]} wrap>
            {["用户状态", "证据链", "风险等级", "下一步动作", "负责角色", "是否进入续费判断"].map((item) => <Tag key={item} color="processing">{item}</Tag>)}
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

function getUserDecision(user) {
  if (isNoComplaint(user.level)) {
    return {
      status: "续费机会",
      color: "blue",
      owner: "顾问",
      priority: "本周跟进",
      summary: "当前无客诉，学情和服务体验稳定，适合结合课消、意向度和匹配度进入续费建议。",
    };
  }
  if (isPreWarning(user.level)) {
    return {
      status: "客诉预警",
      color: "orange",
      owner: "班主任",
      priority: "今日核查",
      summary: "AI通过企微沟通、学情波动和服务记录识别出潜在客诉风险，当前尚未形成正式客诉，建议先做事实核查和轻量回访。",
    };
  }
  if (user.level === "红色") {
    return {
      status: "高风险客诉",
      color: "red",
      owner: "主管",
      priority: "立即处理",
      summary: "当前核心不是解释结果，而是先由主管统一事实链、承认体验落差，并给出补救路径。",
    };
  }
  if (user.level === "黄色") {
    return {
      status: "体验修复期",
      color: "gold",
      owner: "班主任",
      priority: "24小时闭环",
      summary: "当前不适合销售推进，应先修复教学体验，完成旁听诊断、老师匹配和阶段报告。",
    };
  }
  return {
    status: "轻微客诉",
    color: "green",
    owner: "班主任",
    priority: "24小时闭环",
    summary: "当前属于轻微体验问题，建议先快速处理并回访，确认降级后再进入续费判断。",
  };
}

function getUserTimeline(user) {
  return [
    { color: "blue", label: "订单", children: `已购产品：${user.products.join("、")}，累计消费${user.spent}` },
    { color: "green", label: "上课", children: `出勤率${user.learning.attendance}%，课程进度${user.learning.course}` },
    { color: user.learning.homework < 70 ? "red" : "green", label: "作业/模考", children: `作业完成${user.learning.homework}%，模考/结果变化：${user.learning.mock}` },
    { color: isNoComplaint(user.level) ? "blue" : user.level === "绿色" ? "green" : isPreWarning(user.level) ? "orange" : user.level === "黄色" ? "gold" : "red", label: "沟通", children: `${user.communication.emotion}，关注点：${user.communication.focus}` },
    { color: isNoComplaint(user.level) ? "blue" : isPreWarning(user.level) ? "orange" : "red", label: "客诉/机会", children: `${user.complaint.category}，下一步：${user.action}` },
    { color: "blue", label: "续费判断", children: `${user.renewal.fit}，推荐路径：${user.renewal.path}` },
  ];
}

function getServiceRoles(user) {
  return [
    { role: "班主任", person: user.owner.replace("班主任 ", ""), responsibility: "日常管理、情绪安抚、学习反馈、回访闭环", action: isNoComplaint(user.level) ? "输出阶段成果报告" : isPreWarning(user.level) ? "核查AI预警并轻量回访" : "先完成首次安抚" },
    { role: "顾问", person: user.advisor.replace("顾问 ", ""), responsibility: "续费转化、产品组合、商务沟通", action: isNoComplaint(user.level) ? "准备续费方案" : "暂缓销售动作" },
    { role: "教务", person: "排课团队", responsibility: "排课协调、换老师、试听安排、课表稳定", action: user.level === "黄色" ? "安排替换老师试听" : "保持排课稳定" },
    { role: "教师", person: "授课老师", responsibility: "课堂交付、课后反馈、知识点补弱", action: user.level === "黄色" ? "调整课堂节奏" : "同步学习表现" },
    { role: "升学规划", person: user.planner.replace("升学规划 ", ""), responsibility: "长期路径、申请节点、规划价值呈现", action: isNoComplaint(user.level) ? "发起路径诊断" : isPreWarning(user.level) ? "暂不介入，等待预警核查" : "参与事实链复盘" },
  ];
}

function UserProfile({ user, go }) {
  const decision = getUserDecision(user);
  const hasComplaint = hasComplaintRisk(user.level);
  const roleColumns = [
    { title: "角色", dataIndex: "role", width: 110, render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "负责人", dataIndex: "person", width: 120 },
    { title: "职责", dataIndex: "responsibility" },
    { title: "AI建议动作", dataIndex: "action", width: 180 },
  ];
  const evidenceTabs = [
    {
      key: "communication",
      label: "沟通证据",
      children: <List size="small" dataSource={user.complaint.excerpts} renderItem={(item) => <List.Item>{item}</List.Item>} />,
    },
    {
      key: "learning",
      label: "学情证据",
      children: (
        <Descriptions column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="出勤率">{user.learning.attendance}%</Descriptions.Item>
          <Descriptions.Item label="作业完成">{user.learning.homework}%</Descriptions.Item>
          <Descriptions.Item label="模考/结果">{user.learning.mock}</Descriptions.Item>
          <Descriptions.Item label="课程进度">{user.learning.course}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "business",
      label: "经营证据",
      children: (
        <List
          size="small"
          dataSource={[`累计消费${user.spent}，潜在机会${user.chance}`, `已购产品：${user.products.join("、")}`, `10W+相似度${user.value}%`, user.renewal.reason]}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      ),
    },
  ];
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card
          title={<Space><Title level={4}>{user.name}</Title><RiskTag level={user.level} /><Tag color={decision.color}>{decision.status}</Tag></Space>}
          extra={<Space wrap>{hasComplaint ? <Button danger={!isPreWarning(user.level)} icon={<AlertOutlined />} onClick={() => go("complaintDetail")}>{isPreWarning(user.level) ? "查看预警" : "处理客诉"}</Button> : null}<Button icon={<LineChartOutlined />} type="primary" onClick={() => go("renewalDetail")}>续费建议</Button></Space>}
        >
          <Paragraph>{user.profile}</Paragraph>
          <Descriptions column={{ xs: 1, md: 2, xl: 4 }} size="small">
            <Descriptions.Item label="阶段">{user.stage}</Descriptions.Item>
            <Descriptions.Item label="累计消费">{user.spent}</Descriptions.Item>
            <Descriptions.Item label="潜在机会">{user.chance}</Descriptions.Item>
            <Descriptions.Item label="已购产品"><ProductTags items={user.products} /></Descriptions.Item>
            <Descriptions.Item label="班主任">{user.owner}</Descriptions.Item>
            <Descriptions.Item label="顾问">{user.advisor}</Descriptions.Item>
            <Descriptions.Item label="升学规划">{user.planner}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={16}>
        <Card title="AI用户摘要" extra={<Tag color={decision.color}>{decision.priority}</Tag>}>
          <Alert type={user.level === "红色" ? "error" : user.level === "黄色" || isPreWarning(user.level) ? "warning" : "info"} showIcon message={decision.summary} />
          <Row gutter={[12, 12]} className="profile-decision-row">
            <Col xs={24} md={8}><Statistic title="风险指数" value={user.risk} suffix="%" valueStyle={{ color: user.risk > 80 ? "#cf1322" : user.risk > 60 ? "#d48806" : "#16a34a" }} /></Col>
            <Col xs={24} md={8}><Statistic title="10W+相似度" value={user.value} suffix="%" valueStyle={{ color: "#1b63d9" }} /></Col>
            <Col xs={24} md={8}><Statistic title="主责角色" value={decision.owner} /></Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="快捷动作">
          <Space direction="vertical" className="full-width">
            {hasComplaint ? <Button block danger={!isPreWarning(user.level)} icon={<AlertOutlined />} onClick={() => go("complaintDetail")}>{isPreWarning(user.level) ? "查看AI客诉预警" : "处理学情客诉"}</Button> : null}
            <Button block type="primary" icon={<LineChartOutlined />} onClick={() => go("renewalDetail")}>查看续费建议</Button>
            <Button block icon={<BulbOutlined />} onClick={() => go(hasComplaint ? "complaintDetail" : "renewal")}>{hasComplaint ? "生成客诉处理方案" : "生成续费节奏建议"}</Button>
          </Space>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="学情摘要">
          <Row gutter={[12, 12]}>
            <Col span={12}><Statistic title="出勤率" value={user.learning.attendance} suffix="%" /></Col>
            <Col span={12}><Statistic title="作业完成" value={user.learning.homework} suffix="%" /></Col>
            <Col span={12}><Statistic title="模考变化" value={user.learning.mock} /></Col>
            <Col span={12}><Statistic title="课程进度" value={user.learning.course} /></Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="沟通摘要">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="情绪">{user.communication.emotion}</Descriptions.Item>
            <Descriptions.Item label="关注点">{user.communication.focus}</Descriptions.Item>
            <Descriptions.Item label="历史承诺">{user.communication.promise}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="AI证据链">
          <Tabs items={evidenceTabs} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="当前标签">
          <ProductTags items={user.tags} />
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="用户关键时间线" extra={<Tag color="blue">企微 + 订单 + 课程 + 学情</Tag>}>
          <Timeline items={getUserTimeline(user)} />
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="AI原始判断依据">
          <List size="small" dataSource={user.evidence} renderItem={(item) => <List.Item><AuditOutlined className="success-icon" />{item}</List.Item>} />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="服务角色协同图" extra={<Tag color="blue">内部员工助手视角</Tag>}>
          <Table rowKey="role" size="small" columns={roleColumns} dataSource={getServiceRoles(user)} pagination={false} scroll={{ x: 860 }} />
        </Card>
      </Col>
    </Row>
  );
}

function ComplaintDetailPage({ user, go, generated }) {
  const complaintUsers = users.filter((item) => hasComplaintRisk(item.level));
  const complaintIndex = Math.max(0, complaintUsers.findIndex((item) => item.id === user.id));
  const currentStage = getComplaintStage(user, complaintIndex);
  const stageOrder = ["预警", "定级", "处理", "复盘", "回访"];
  const currentStep = Math.max(0, stageOrder.indexOf(currentStage));
  const [activeStep, setActiveStep] = useState(currentStep);
  const activeStage = stageOrder[activeStep] || currentStage;
  const decision = getUserDecision(user);
  const roleSuggestion = isPreWarning(user.level)
    ? "班主任主导预警核查，教师同步观察，顾问暂缓销售"
    : user.level === "红色" || user.level === "黑色"
    ? "主管主导，班主任配合，顾问暂停销售"
    : user.level === "黄色"
      ? "班主任主导，教学主管和教务配合"
      : "班主任快速闭环，教师同步调整";
  const rhythm = isPreWarning(user.level)
    ? "今日核查触发来源，24小时轻量回访，3天判断关闭或升级"
    : user.level === "红色" || user.level === "黑色"
    ? "2小时主管介入，24小时形成事实链，7天跟踪降级"
    : user.level === "黄色"
      ? "24小时首次反馈，3天执行调整，7天回访"
      : "24小时处理并回访，确认关闭后转续费判断";
  const handlingSteps = [
    "确认客诉事实和触发来源，避免只按单条聊天判断。",
    "根据客诉等级确定主责角色和沟通边界。",
    "先处理服务体验和信任问题，再讨论续费或产品推荐。",
    "形成回访节点和复盘标签，沉淀为后续相似案例。",
  ];
  const detailTimeline = [
    { label: "订单", color: "blue", text: `已购产品：${user.products.join("、")}，累计消费${user.spent}` },
    { label: "上课", color: "green", text: `出勤率${user.learning.attendance}%，课程进度${user.learning.course}` },
    { label: "作业/模考", color: "red", text: `作业完成${user.learning.homework}%，模考/结果变化：${user.learning.mock}` },
    { label: "沟通", color: "gold", text: `${user.communication.emotion}，关注点：${user.communication.focus}` },
    { label: "客诉/机会", color: "red", text: `${user.complaint.category}，下一步：${user.action}` },
    { label: "续费判断", color: "blue", text: `${user.renewal.fit}，推荐路径：${user.renewal.path}` },
  ];
  const closeStandard = user.complaint.review?.[2]?.replace("结案标准：", "") || "家长认可调整方案且作业完成率回升";
  const complaintStageDetails = {
    预警: {
      tag: "风险识别",
      summary: isPreWarning(user.level) ? "AI已从企微沟通、作业完成率和课堂互动中识别出潜在客诉风险，需要先核查是否存在真实不满。" : "系统已从企微沟通、作业完成率和课堂互动中识别出体验风险，需要先确认是否为真实客诉。",
      reason: [
        "家长连续出现效果焦虑表达，且关键词集中在教学体验而非单次情绪抱怨。",
        "作业完成率、课堂互动等学情指标同步下滑，说明风险有数据支撑。",
        "问题尚未完成责任归因，预警阶段只做风险识别和事实确认，不直接定责。",
      ],
      sources: [
        "企微聊天：抽取“没效果、听不懂、讲太快”等负向触发词。",
        `学情数据：出勤率${user.learning.attendance}%，作业完成${user.learning.homework}%。`,
        "课堂反馈：学生互动次数下降，可能存在节奏或老师匹配问题。",
      ],
      actions: [
        "班主任核对原始聊天、最近一次课堂反馈和作业记录。",
        "标记触发词、触发时间、涉及课程和涉及老师。",
        "生成预警记录，不在该节点给出补偿或续费判断。",
      ],
      owner: "班主任",
      output: "预警标签、触发证据、初步风险等级",
      standard: "确认是否存在连续负向反馈，避免误把单次情绪当作正式客诉。",
    },
    定级: {
      tag: "等级判断",
      summary: `当前建议定为${user.level}客诉，核心依据是问题严重度、结果可逆性、消费金额和情绪强度。`,
      reason: [
        `问题类型为${user.complaint.category}，已从单点反馈进入服务体验判断。`,
        `当前等级为${user.level}，处理时限为${user.complaint.deadline}，需要纳入对应SOP。`,
        "定级节点只确定等级、主责和升级边界，不展开具体修复方案。",
      ],
      sources: [
        `客诉工单：${user.complaint.ticket}，来源为${user.complaint.source}。`,
        `沟通强度：${user.communication.emotion}，关注点为${user.communication.focus}。`,
        `用户价值：累计消费${user.spent}，已购${user.products.join("、")}。`,
      ],
      actions: [
        "按关键词强度、结果影响、是否可逆和用户价值判定等级。",
        "确认主责角色、协同角色和是否需要主管介入。",
        "锁定沟通禁忌和审批边界，避免一线越权承诺。",
      ],
      owner: user.level === "红色" || user.level === "黑色" ? "主管" : "班主任",
      output: "客诉等级、主责角色、沟通边界",
      standard: "等级与证据链一致，且所有处理角色知道哪些话不能说、哪些承诺不能给。",
    },
    处理: {
      tag: "体验修复",
      summary: decision.summary,
      reason: [
        "当前真实矛盾是教学体验和效果信任，不是续费意向不足。",
        "家长关注老师匹配、课堂节奏和阶段效果，处理节点必须给出可执行修复动作。",
        "继续销售推进会放大负向感受，因此该节点只处理体验修复。",
      ],
      sources: [
        `问题类型：${user.complaint.category}。`,
        `沟通摘录：${user.complaint.excerpts.join(" / ")}`,
        `学情指标：作业完成${user.learning.homework}%，课程进度${user.learning.course}。`,
        `处理负责人：${user.complaint.owner}。`,
      ],
      actions: handlingSteps,
      owner: roleSuggestion,
      output: "处理方案、角色分工、执行节点、家长沟通话术",
      standard: closeStandard,
    },
    复盘: {
      tag: "过程复核",
      summary: "处理动作执行后，需要复盘问题归因、服务动作是否完成，以及家长情绪是否明显降级。",
      reason: [
        "复盘节点只验证处理过程，不重新识别客诉，也不直接进入续费判断。",
        "需要确认旁听诊断、老师匹配、阶段报告等承诺动作是否按时完成。",
        "若家长情绪未降级或学情指标未恢复，不能进入回访关闭。",
      ],
      sources: [
        `处理动作：${handlingSteps.join(" / ")}`,
        `复盘项：${user.complaint.review.join(" / ")}`,
        "内部记录：电话安抚、教学主管旁听、替换试听、阶段学习报告。",
      ],
      actions: [
        "核对每个处理动作是否完成、是否有负责人和时间记录。",
        "沉淀问题归因：教学节奏、反馈不足、预期管理或老师匹配。",
        "形成复盘标签，供后续相似案例和AI策略引用。",
      ],
      owner: "班主任 + 教学主管",
      output: "复盘结论、归因标签、案例沉淀",
      standard: "家长认可处理过程，内部能解释问题来源和后续防复发动作。",
    },
    回访: {
      tag: "满意度验证",
      summary: "回访阶段重点不是再次解释，而是确认情绪是否降级、体验是否恢复、是否可以进入后续续费判断。",
      reason: [
        "回访节点只做用户侧验证，不能用内部处理完成替代家长确认。",
        "需要确认家长是否认可调整方案，学生体验和作业完成是否回升。",
        "只有回访结果稳定，才允许进入后续续费判断。",
      ],
      sources: [
        ...user.complaint.followups,
        `结案标准：${closeStandard}`,
        `当前续费门槛：${user.renewal.fit}，需在客诉降级后再判断。`,
      ],
      actions: [
        "按24小时、3天、7天节点跟进满意度。",
        "确认是否仍有未解决诉求或补偿争议。",
        "如果客诉降级，再由顾问进入续费判断；未降级则继续服务修复。",
      ],
      owner: "班主任主导，顾问等待进入窗口",
      output: "回访记录、关闭状态、是否进入续费窗口",
      standard: "家长确认问题已被处理，且无新的负向升级信号。",
    },
  };
  const activeDetail = complaintStageDetails[activeStage] || complaintStageDetails[currentStage] || complaintStageDetails.处理;

  return (
    <div className="detail-page complaint-detail-page">
      <div className="complaint-detail-action-bar">
        <Button onClick={() => go("complaint")}>返回客诉列表</Button>
        <Space wrap>
          <Button onClick={() => go("agent")}>问学情Agent</Button>
          <Button type="primary" onClick={() => go("renewal")}>客诉后续费判断</Button>
        </Space>
      </div>
      <div className="detail-two-column-shell">
        <aside className="detail-left-pane">
          <section className="detail-section complaint-student-section">
            <div className="complaint-student-head">
              <Space size={8} wrap>
                <Text strong className="complaint-student-name">{user.name}</Text>
                <RiskTag level={user.level} />
                <Tag color="processing">{currentStage}</Tag>
              </Space>
              <Button type="link" onClick={() => go("profile", user.id)}>学生详情</Button>
            </div>
            <div className="complaint-meta-list">
              <div><span>当前客诉阶段：</span><strong>{currentStage}</strong></div>
              <div><span>问题类型：</span><strong>{user.complaint.category}</strong></div>
              <div><span>工单编号：</span><strong>{user.complaint.ticket}</strong></div>
              <div><span>处理负责人：</span><strong>{user.complaint.owner}</strong></div>
              <div><span>处理时限：</span><strong>{user.complaint.deadline}</strong></div>
              <div><span>累计消费：</span><strong>{user.spent}</strong></div>
              <div><span>已购产品：</span><ProductTags items={user.products} /></div>
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>客诉原因</Title>
            <div className="complaint-line-list">
              {user.evidence.map((item) => <div key={item}>{item}</div>)}
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>沟通与标签</Title>
            <div className="complaint-meta-list compact">
              <div><span>情绪变化：</span><strong>{user.communication.emotion}</strong></div>
              <div><span>关注点：</span><strong>{user.communication.focus}</strong></div>
              <div><span>历史承诺：</span><strong>{user.communication.promise}</strong></div>
            </div>
            <ProductTags items={user.tags} />
          </section>

          <section className="detail-section">
            <Title level={5}>用户关键时间线</Title>
            <div className="complaint-timeline">
              {detailTimeline.map((item) => (
                <div className="complaint-timeline-row" key={item.label}>
                  <div className="complaint-timeline-label">{item.label}</div>
                  <div className={`complaint-timeline-dot ${item.color}`} />
                  <div className="complaint-timeline-text">{item.text}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="detail-right-pane">
          <section className="detail-section complaint-ai-section">
            <div className="complaint-section-head">
              <Space><SafetyCertificateOutlined /><Text strong>AI处理建议</Text></Space>
              <Tag color={decision.color}>{decision.priority}</Tag>
            </div>
            <Alert
              type={user.level === "红色" || user.level === "黑色" ? "error" : user.level === "黄色" || isPreWarning(user.level) ? "warning" : "info"}
              showIcon
              message={decision.summary}
              description={isPreWarning(user.level) ? "预警阶段先核查触发原因、完成轻量回访和提醒，不直接定义为正式客诉，也不推进销售。" : "先完成事实链和体验修复，再判断是否进入续费窗口。当前页面只服务客诉处理，不做续费推进。"}
            />
            <div className="decision-steps complaint-stage-steps">
              <Steps
                current={activeStep}
                onChange={setActiveStep}
                items={stageOrder.map((item, index) => ({
                  title: (
                    <Space size={6} wrap>
                      <span>{item}</span>
                      {item === currentStage ? <Tag color="blue">当前所处</Tag> : null}
                    </Space>
                  ),
                  description: index === activeStep ? complaintStageDetails[item]?.tag : undefined,
                }))}
              />
            </div>
          </section>

          <section className="detail-section">
            <div className="complaint-stage-state">
              <Space size={8} wrap>
                <Text type="secondary">当前所处阶段</Text>
                <Tag color="blue">{currentStage}</Tag>
                <Text type="secondary">正在查看节点</Text>
                <Tag color={activeStage === currentStage ? "processing" : "default"}>{activeStage}</Tag>
              </Space>
              {activeStage !== currentStage ? <Text type="secondary">当前展示的是{activeStage}节点说明，实际流程仍停留在{currentStage}。</Text> : null}
            </div>
            <div className="complaint-node-title">
              <Title level={5}>{activeStage}节点分析</Title>
              <Space size={8} wrap>
                <Tag color="blue">{activeDetail.tag}</Tag>
                <Tag color="default">主责：{activeDetail.owner}</Tag>
              </Space>
            </div>
            <Alert type="info" showIcon message={activeDetail.summary} />
            <div className="complaint-node-grid">
              <div>
                <Title level={5}>原因分析</Title>
                <div className="complaint-line-list">
                  {activeDetail.reason.map((item) => <div key={item}>{item}</div>)}
                </div>
              </div>
              <div>
                <Title level={5}>判断依据来源</Title>
                <div className="complaint-line-list">
                  {activeDetail.sources.map((item) => <div key={item}>{item}</div>)}
                </div>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>节点处理动作</Title>
            <div className="complaint-action-list">
              {activeDetail.actions.map((item) => (
                <div className="complaint-action-row" key={item}>
                  <CheckCircleOutlined className="success-icon" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>输出标准与沟通边界</Title>
            <div className="complaint-boundary-layout">
              <Alert type="info" showIcon message="当前节点完成标准" description={activeDetail.standard} />
              <div className="complaint-forbid-list">
                {user.complaint.forbid.map((item) => (
                  <div key={item}><Tag color="red">禁忌</Tag>{item}</div>
                ))}
              </div>
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>建议话术</Title>
            <Alert type="info" showIcon message={user.talk} />
            {generated ? <Alert className="generated-alert" type="success" showIcon message="AI已生成处理方案、角色分工、节奏安排和回访复盘节点。" /> : null}
          </section>

          <section className="detail-section complaint-evidence-section">
            <div>
              <Title level={5}>聊天/服务记录摘录</Title>
              <div className="complaint-line-list">
                {user.complaint.excerpts.map((item) => <div key={item}>{item}</div>)}
              </div>
            </div>
            <div>
              <Title level={5}>回访复盘</Title>
              <Timeline items={user.complaint.followups.map((item) => ({ children: item }))} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ComplaintPage({ user, generated, go }) {
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState("全部");
  const [stage, setStage] = useState("全部");
  const complaintStages = ["预警", "定级", "处理", "复盘", "回访"];
  const complaintRows = users
    .filter((item) => hasComplaintRisk(item.level))
    .map((item, index) => ({ ...item, complaintStage: getComplaintStage(item, index) }));
  const filteredRows = complaintRows.filter((item) => {
    const keywordHit = !keyword || [item.name, item.stage, item.owner, item.advisor, item.tags.join(" "), item.action].some((field) => field.includes(keyword));
    const levelHit = level === "全部" || item.level === level;
    const stageHit = stage === "全部" || item.complaintStage === stage;
    return keywordHit && levelHit && stageHit;
  });
  const complaintColumns = [
    { title: "学生", dataIndex: "name", width: 120, render: (_, record) => <Button type="link" onClick={() => go("profile", record.id)}>{record.name}</Button> },
    { title: "阶段", dataIndex: "stage", width: 170 },
    { title: "客诉等级", dataIndex: "level", width: 110, render: (value) => <RiskTag level={value} /> },
    { title: "处理阶段", dataIndex: "complaintStage", width: 100, render: (value) => <Tag color="processing">{value}</Tag> },
    { title: "问题类型", dataIndex: ["complaint", "category"], width: 180 },
    { title: "负责人", dataIndex: ["complaint", "owner"], width: 140 },
    { title: "处理时限", dataIndex: ["complaint", "deadline"], width: 160 },
    { title: "AI建议", dataIndex: "action", width: 280 },
    { title: "操作", key: "operation", fixed: "right", width: 120, render: (_, record) => <Button danger={!isPreWarning(record.level)} type="primary" onClick={() => go("complaintDetail", record.id)}>{isPreWarning(record.level) ? "查看预警" : "处理客诉"}</Button> },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Row gutter={[16, 16]}>
          {complaintStages.map((item) => (
            <Col xs={24} sm={12} lg={4} key={item}>
              <Card>
                <Statistic title={item} value={complaintRows.filter((row) => row.complaintStage === item).length} suffix="人" />
              </Card>
            </Col>
          ))}
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic title="客诉总数" value={complaintRows.length} suffix="人" valueStyle={{ color: "#cf1322" }} />
            </Card>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Card title="客诉/预警用户列表">
          <Row gutter={[12, 12]} className="student-filter-row">
            <Col xs={24} lg={9}>
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索学生姓名、负责人、标签或建议" />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={level} onChange={setLevel} options={getRiskLevelOptions(false).map((item) => ({ value: item, label: `等级：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={stage} onChange={setStage} options={["全部", ...complaintStages].map((item) => ({ value: item, label: `阶段：${item}` }))} />
            </Col>
            <Col xs={24} lg={7}>
              <Space wrap>
                <Button onClick={() => { setKeyword(""); setLevel("全部"); setStage("全部"); }}>重置</Button>
                <Button type="primary">搜索</Button>
              </Space>
            </Col>
          </Row>
          <Table rowKey="id" columns={complaintColumns} dataSource={filteredRows} pagination={false} scroll={{ x: 1380 }} />
        </Card>
      </Col>
    </Row>
  );
}

function RenewalDetailPage({ user, go, generated }) {
  const intent = getRenewalIntent(user);
  const recommendedProducts = user.renewal.recommendations?.length
    ? user.renewal.recommendations
    : user.renewal.products.map((product) => ({
      product,
      type: "推荐产品",
      price: "2万起",
      role: user.renewal.ownerRole,
      timing: user.renewal.timing,
      reason: user.renewal.reason,
    }));
  const rhythmSteps = [
    `当前意向度：${intent}，续费匹配度${user.renewal.similarity}%。`,
    `本轮节奏：${user.renewal.timing}。`,
    `主责分工：${user.renewal.ownerRole}。`,
    "先用学情成果和路径价值建立共识，再进入产品和价格沟通。",
  ];
  const matchItems = [
    `用户当前客诉状态：${user.level}，适合进入续费分析。`,
    `累计消费${user.spent}，潜在机会${user.chance}。`,
    `推荐路径：${user.renewal.path}。`,
    `推荐产品：${user.renewal.products.join("、")}。`,
  ];
  const productColumns = [
    { title: "产品", dataIndex: "product", width: 130 },
    { title: "推荐类型", dataIndex: "type", width: 130, render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "价格", dataIndex: "price", width: 90 },
    { title: "负责角色", dataIndex: "role", width: 140 },
    { title: "推荐时机", dataIndex: "timing", width: 140 },
    { title: "推荐理由", dataIndex: "reason" },
  ];
  const detailTimeline = [
    { label: "订单", color: "blue", text: `已购产品：${user.products.join("、")}，累计消费${user.spent}` },
    { label: "学情", color: "green", text: `出勤率${user.learning.attendance}%，作业完成${user.learning.homework}%，课程进度${user.learning.course}` },
    { label: "沟通", color: "gold", text: `${user.communication.emotion}，关注点：${user.communication.focus}` },
    { label: "目标", color: "blue", text: user.profile },
    { label: "机会", color: "green", text: `潜在机会${user.chance}，推荐产品：${user.renewal.products.join("、")}` },
    { label: "续费判断", color: "blue", text: `${user.renewal.fit}，推荐路径：${user.renewal.path}` },
  ];

  return (
    <div className="detail-page renewal-detail-page">
      <Space wrap className="detail-top-action-bar">
        <Button onClick={() => go("renewal")}>返回续费列表</Button>
        <Button onClick={() => go("agent")}>问学情Agent</Button>
        <Button danger onClick={() => go("complaintDetail")}>转客诉判断</Button>
      </Space>
      <div className="detail-two-column-shell">
        <aside className="detail-left-pane">
          <section className="detail-section complaint-student-section">
            <div className="complaint-student-head">
              <Space size={8} wrap>
                <Text strong className="complaint-student-name">{user.name}</Text>
                <RiskTag level={user.level} />
                <Tag color="blue">{intent}</Tag>
              </Space>
              <Button type="link" onClick={() => go("profile", user.id)}>学生详情</Button>
            </div>
            <div className="complaint-meta-list">
              <div><span>当前客诉阶段：</span><strong>{isNoComplaint(user.level) ? "无客诉" : isPreWarning(user.level) ? "AI预警待核查" : "客诉处理中"}</strong></div>
              <div><span>学生阶段：</span><strong>{user.stage}</strong></div>
              <div><span>累计消费：</span><strong>{user.spent}</strong></div>
              <div><span>潜在机会：</span><strong>{user.chance}</strong></div>
              <div><span>已购产品：</span><ProductTags items={user.products} /></div>
              <div><span>班主任：</span><strong>{user.owner}</strong></div>
              <div><span>顾问：</span><strong>{user.advisor}</strong></div>
              <div><span>升学规划：</span><strong>{user.planner}</strong></div>
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>用户摘要</Title>
            <Paragraph className="detail-summary-text">{user.profile}</Paragraph>
            <div className="complaint-meta-list compact">
              <div><span>沟通情绪：</span><strong>{user.communication.emotion}</strong></div>
              <div><span>关注点：</span><strong>{user.communication.focus}</strong></div>
              <div><span>历史承诺：</span><strong>{user.communication.promise}</strong></div>
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>学情摘要</Title>
            <div className="detail-metric-grid">
              <div><span>出勤率</span><strong>{user.learning.attendance}%</strong></div>
              <div><span>作业完成</span><strong>{user.learning.homework}%</strong></div>
              <div><span>模考/结果</span><strong>{user.learning.mock}</strong></div>
              <div><span>课程进度</span><strong>{user.learning.course}</strong></div>
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>用户关键时间线</Title>
            <div className="complaint-timeline">
              {detailTimeline.map((item) => (
                <div className="complaint-timeline-row" key={item.label}>
                  <div className="complaint-timeline-label">{item.label}</div>
                  <div className={`complaint-timeline-dot ${item.color}`} />
                  <div className="complaint-timeline-text">{item.text}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="detail-right-pane">
          <section className="detail-section complaint-ai-section">
            <div className="complaint-section-head">
              <Space><LineChartOutlined /><Text strong>AI续费建议</Text></Space>
              <Tag color="blue">匹配度 {user.renewal.similarity}%</Tag>
            </div>
            <Alert
              type="info"
              showIcon
              message={`建议进入${intent}续费沟通节奏`}
              description={user.renewal.reason}
            />
            <div className="renewal-match">
              <Space align="center" className="full-width">
                <Text strong>续费匹配度</Text>
                <Progress percent={user.renewal.similarity} />
              </Space>
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>续费节奏建议</Title>
            <div className="complaint-action-list">
              {rhythmSteps.map((item) => (
                <div className="complaint-action-row" key={item}>
                  <CheckCircleOutlined className="success-icon" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <Title level={5}>产品推荐</Title>
            <Table rowKey="product" size="small" columns={productColumns} dataSource={recommendedProducts} pagination={false} scroll={{ x: 960 }} />
          </section>

          <section className="detail-section complaint-evidence-section">
            <div>
              <Title level={5}>判断依据</Title>
              <div className="complaint-line-list">
                {[...matchItems, ...user.renewal.evidence].map((item) => <div key={item}>{item}</div>)}
              </div>
            </div>
            <div>
              <Title level={5}>沟通话术与边界</Title>
              <Alert type="info" showIcon message={user.talk} />
              <Alert className="section-alert" type="warning" showIcon message="如果用户出现新的客诉或情绪负向升高，应暂停续费推进，转入客诉处理流程。" />
            </div>
          </section>

          {generated ? <Alert type="success" showIcon message="AI已生成续费建议、产品推荐、节奏安排和异议处理预案。" /> : null}
        </main>
      </div>
    </div>
  );
}

function RenewalPage({ user, generated, go }) {
  const [keyword, setKeyword] = useState("");
  const [intent, setIntent] = useState("全部");
  const [product, setProduct] = useState("全部");
  const intentLevels = ["强意向", "高意向", "中意向", "低意向", "暂缓观察"];
  const renewalRows = users
    .filter((item) => isNoComplaint(item.level))
    .map((item) => ({ ...item, renewalIntent: getRenewalIntent(item) }));
  const filteredRows = renewalRows.filter((item) => {
    const keywordHit = !keyword || [item.name, item.stage, item.owner, item.advisor, item.renewal.path, item.renewal.products.join(" "), item.action].some((field) => field.includes(keyword));
    const intentHit = intent === "全部" || item.renewalIntent === intent;
    const productHit = product === "全部" || item.products.includes(product) || item.renewal.products.includes(product);
    return keywordHit && intentHit && productHit;
  });
  const renewalColumns = [
    { title: "学生", dataIndex: "name", width: 120, render: (_, record) => <Button type="link" onClick={() => go("profile", record.id)}>{record.name}</Button> },
    { title: "阶段", dataIndex: "stage", width: 180 },
    { title: "意向度", dataIndex: "renewalIntent", width: 110, render: (value) => <Tag color={value === "强意向" ? "green" : value === "高意向" ? "blue" : value === "中意向" ? "processing" : value === "低意向" ? "gold" : "default"}>{value}</Tag> },
    { title: "续费匹配度", dataIndex: ["renewal", "similarity"], width: 160, render: (value) => <Progress percent={value} size="small" /> },
    { title: "推荐产品", dataIndex: ["renewal", "products"], width: 220, render: (value) => <ProductTags items={value} /> },
    { title: "续费节奏", dataIndex: ["renewal", "timing"], width: 150 },
    { title: "推荐路径", dataIndex: ["renewal", "path"], width: 280 },
    { title: "潜在机会", dataIndex: "chance", width: 100 },
    { title: "操作", key: "operation", fixed: "right", width: 120, render: (_, record) => <Button type="primary" onClick={() => go("renewalDetail", record.id)}>查看建议</Button> },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Row gutter={[16, 16]}>
          {intentLevels.map((item) => (
            <Col xs={24} sm={12} lg={4} key={item}>
              <Card>
                <Statistic title={item} value={renewalRows.filter((row) => row.renewalIntent === item).length} suffix="人" />
              </Card>
            </Col>
          ))}
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic title="续费用户" value={renewalRows.length} suffix="人" valueStyle={{ color: "#1b63d9" }} />
            </Card>
          </Col>
        </Row>
      </Col>
      <Col span={24}>
        <Card title="续费用户数据列表" extra={<Tag color="blue">无客诉用户进入续费分析</Tag>}>
          <Row gutter={[12, 12]} className="student-filter-row">
            <Col xs={24} lg={9}>
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索学生姓名、推荐产品、路径或负责人" />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={intent} onChange={setIntent} options={["全部", ...intentLevels].map((item) => ({ value: item, label: `意向：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={product} onChange={setProduct} options={["全部", ...products.map(([name]) => name)].map((item) => ({ value: item, label: `产品：${item}` }))} />
            </Col>
            <Col xs={24} lg={7}>
              <Space wrap>
                <Button onClick={() => { setKeyword(""); setIntent("全部"); setProduct("全部"); }}>重置</Button>
                <Button type="primary" onClick={() => go("agent")}>问学情Agent</Button>
              </Space>
            </Col>
          </Row>
          <Table rowKey="id" columns={renewalColumns} dataSource={filteredRows} pagination={false} scroll={{ x: 1380 }} />
        </Card>
      </Col>
    </Row>
  );
}

function HighValuePage({ go }) {
  const [filters, setFilters] = useState({
    timeRange: "近1年",
    country: "全部",
    stage: "全部",
    firstProduct: "全部",
    successType: "全部",
  });
  const [aiGenerated, setAiGenerated] = useState(false);
  const successCases = [
    {
      id: "tw-001",
      name: "陈同学",
      stage: "高二 / 美本方向",
      stageGroup: "高中",
      country: "美国",
      source: "私域转介绍",
      firstProduct: "学科培训",
      successType: "多产品组合",
      total: 12.6,
      cycle: 248,
      referral: "是",
      complaintRecovered: "黄色挽回",
      path: ["学科培训", "语陪", "升学规划", "竞赛/营地"],
      products: ["学科培训", "语陪", "升学规划", "竞赛", "营地"],
      factors: ["家长深度参与", "目标院校明确", "产品延展空间大", "服务信任建立快"],
      serviceActions: ["阶段成果报告", "路径诊断会", "季度目标复盘"],
      reusable: "先用课程交付建立信任，再由规划老师承接三年路径，顾问跟进竞赛和营地组合。",
    },
    {
      id: "tw-002",
      name: "周同学",
      stage: "高三 / 英本申请",
      stageGroup: "高中",
      country: "英国",
      source: "线上投放",
      firstProduct: "升学规划",
      successType: "客诉挽回",
      total: 15.8,
      cycle: 182,
      referral: "否",
      complaintRecovered: "红色挽回",
      path: ["升学规划", "文书服务", "笔试面试", "补申咨询"],
      products: ["升学规划", "文书服务", "笔试面试", "补申咨询"],
      factors: ["结果目标强", "重视专业背书", "过程证据完整", "主管及时介入"],
      serviceActions: ["事实链复盘", "补救路径会", "主管统一沟通"],
      reusable: "结果不达预期时避免争责，先由主管统一事实链，再给出补申和面试复盘路径。",
    },
    {
      id: "tw-003",
      name: "林同学",
      stage: "初三 / 海外本科长期规划",
      stageGroup: "初中",
      country: "多国家",
      source: "老客户续购",
      firstProduct: "学科培训",
      successType: "长期规划",
      total: 10.9,
      cycle: 326,
      referral: "是",
      complaintRecovered: "无客诉",
      path: ["学科培训", "路径诊断", "升学规划", "暑期营地"],
      products: ["学科培训", "升学规划", "暑期营地"],
      factors: ["低龄长周期", "家长深度参与", "目标需要结构化", "课消节点清晰"],
      serviceActions: ["阶段诊断", "目标拆解", "季度复盘"],
      reusable: "低龄客户不要一次性高价打包，按年级拆目标，用季度复盘持续证明服务价值。",
    },
    {
      id: "tw-004",
      name: "马同学",
      stage: "高一 / IB方向",
      stageGroup: "高中",
      country: "英国",
      source: "活动到访",
      firstProduct: "语陪",
      successType: "高续费",
      total: 13.4,
      cycle: 214,
      referral: "否",
      complaintRecovered: "无客诉",
      path: ["语陪", "学科培训", "竞赛辅导", "学科续排"],
      products: ["语陪", "学科培训", "竞赛辅导"],
      factors: ["阶段效果可见", "课程体验稳定", "背景提升意识强", "可扩科"],
      serviceActions: ["学习成果可视化", "竞赛差距诊断", "课消前续排"],
      reusable: "稳定体验客户适合在课消65%-75%之间，用成果报告承接续排和竞赛背景提升。",
    },
    {
      id: "tw-005",
      name: "许同学",
      stage: "本科 / 美研申请",
      stageGroup: "本科",
      country: "美国",
      source: "私域转介绍",
      firstProduct: "背景提升",
      successType: "转介绍",
      total: 18.2,
      cycle: 168,
      referral: "是",
      complaintRecovered: "无客诉",
      path: ["背景提升", "论文服务", "文书服务", "申请服务"],
      products: ["背景提升", "论文服务", "文书服务", "申请服务"],
      factors: ["专业方向明确", "信任专家背书", "交付物价值强", "家长资源圈层强"],
      serviceActions: ["专家方案评审", "项目成果展示", "申请故事线复盘"],
      reusable: "高净值转介绍客户更看重专家可信度和交付物质量，适合用项目成果带动申请服务。",
    },
    {
      id: "tw-006",
      name: "唐同学",
      stage: "高二 / 加拿大本科",
      stageGroup: "高中",
      country: "加拿大",
      source: "老客户续购",
      firstProduct: "升学规划",
      successType: "长期规划",
      total: 11.7,
      cycle: 286,
      referral: "是",
      complaintRecovered: "绿色闭环",
      path: ["升学规划", "学科培训", "营地", "文书服务"],
      products: ["升学规划", "学科培训", "营地", "文书服务"],
      factors: ["目标路径清晰", "家长高频沟通", "阶段节点明确", "多产品自然衔接"],
      serviceActions: ["路径时间表", "月度家长会", "申请节点提醒"],
      reusable: "规划首单客户要把产品放进一张时间表，避免让家长感到被拆开销售。",
    },
  ];

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const filteredCases = successCases.filter((item) => (
    (filters.country === "全部" || item.country === filters.country)
    && (filters.stage === "全部" || item.stageGroup === filters.stage)
    && (filters.firstProduct === "全部" || item.firstProduct === filters.firstProduct)
    && (filters.successType === "全部" || item.successType === filters.successType)
  ));
  const activeCases = filteredCases.length ? filteredCases : successCases;
  const totalAmount = activeCases.reduce((sum, item) => sum + item.total, 0);
  const avgAmount = Number((totalAmount / activeCases.length).toFixed(1));
  const avgCycle = Math.round(activeCases.reduce((sum, item) => sum + item.cycle, 0) / activeCases.length);
  const avgProductCount = Number((activeCases.reduce((sum, item) => sum + item.products.length, 0) / activeCases.length).toFixed(1));
  const renewalRate = Math.round((activeCases.filter((item) => item.path.length >= 3).length / activeCases.length) * 100);
  const referralRate = Math.round((activeCases.filter((item) => item.referral === "是").length / activeCases.length) * 100);
  const recoveryRate = Math.round((activeCases.filter((item) => item.complaintRecovered.includes("挽回") || item.complaintRecovered.includes("闭环")).length / activeCases.length) * 100);

  function makeDistribution(key) {
    const counts = activeCases.reduce((result, item) => {
      const value = item[key];
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / activeCases.length) * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  const stageDistribution = makeDistribution("stageGroup");
  const countryDistribution = makeDistribution("country");
  const sourceDistribution = makeDistribution("source");
  const firstProductDistribution = makeDistribution("firstProduct");
  const productCombos = activeCases
    .map((item) => ({
      id: item.id,
      name: item.path.join(" + "),
      total: item.total,
      cycle: item.cycle,
      stage: item.stageGroup,
      fit: item.factors.slice(0, 2).join("、"),
    }))
    .sort((a, b) => b.total - a.total);
  const factorRows = ["家长深度参与", "目标院校明确", "产品延展空间大", "服务信任建立快", "阶段效果可见", "专家背书", "主管及时介入"]
    .map((factor) => {
      const matched = activeCases.filter((item) => item.factors.some((value) => value.includes(factor) || factor.includes(value)));
      return {
        factor,
        percent: Math.round((matched.length / activeCases.length) * 100),
        amount: matched.length ? Number((matched.reduce((sum, item) => sum + item.total, 0) / matched.length).toFixed(1)) : 0,
        suggestion: {
          家长深度参与: "优先安排阶段复盘会，让家长参与路径确认。",
          目标院校明确: "用目标差距诊断承接规划、背景提升和申请服务。",
          产品延展空间大: "把多产品放进一张升学时间表，降低被销售感。",
          服务信任建立快: "先展示阶段成果，再推进下一阶段服务。",
          阶段效果可见: "在课消关键点前输出成果报告，触发续排。",
          专家背书: "用专家评审和交付物质量强化高客单合理性。",
          主管及时介入: "高预期或客诉场景由主管统一事实链和补救路径。",
        }[factor],
      };
    })
    .filter((item) => item.percent > 0)
    .sort((a, b) => b.percent - a.percent);
  const serviceActions = ["阶段成果报告", "路径诊断会", "季度目标复盘", "事实链复盘", "补救路径会", "专家方案评审", "课消前续排"]
    .map((action) => {
      const matched = activeCases.filter((item) => item.serviceActions.some((value) => value.includes(action) || action.includes(value)));
      return {
        action,
        percent: Math.round((matched.length / activeCases.length) * 100),
        role: action.includes("事实链") || action.includes("补救") ? "主管/规划" : action.includes("路径") || action.includes("专家") ? "升学规划" : "班主任/顾问",
        value: {
          阶段成果报告: "把短期课程体验转成可感知价值。",
          路径诊断会: "把单产品需求升级为长期升学路径。",
          季度目标复盘: "维持长期服务节奏和续费窗口。",
          事实链复盘: "降低争责情绪，统一沟通依据。",
          补救路径会: "将客诉处理转向下一步可执行方案。",
          专家方案评审: "支撑背景提升、论文、申请等高客单服务。",
          课消前续排: "在体验稳定时提前锁定连续服务。",
        }[action],
      };
    })
    .filter((item) => item.percent > 0);

  const caseColumns = [
    { title: "成功客户", dataIndex: "name", width: 110 },
    { title: "阶段/国家", key: "stageCountry", width: 180, render: (_, record) => `${record.stage} · ${record.country}` },
    { title: "累计消费", dataIndex: "total", width: 100, render: (value) => `${value}万` },
    { title: "首单产品", dataIndex: "firstProduct", width: 110, render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "消费路径", dataIndex: "path", width: 320, render: (items) => items.join(" -> ") },
    { title: "关键成功因子", dataIndex: "factors", width: 260, render: (items) => <ProductTags items={items.slice(0, 3)} /> },
    { title: "可复用经验", dataIndex: "reusable" },
    { title: "操作", key: "operation", fixed: "right", width: 110, render: () => <Button type="link" onClick={() => go("renewal", "u-high")}>复用打法</Button> },
  ];
  return (
    <Row gutter={[16, 16]} className="high-value-dashboard">
      <Col span={24}>
        <Card
          title="10W+成功客户画像"
          extra={(
            <Space wrap>
              <Button onClick={() => setAiGenerated(true)} icon={<BulbOutlined />}>生成AI复盘总结</Button>
              <Button>导出报告</Button>
              <Button type="primary" onClick={() => go("agent")}>问学情Agent</Button>
            </Space>
          )}
        >
          <Paragraph className="detail-summary-text">
            基于历史累计消费超过10万元的成功客户，复盘其画像特征、消费路径、服务动作和可复用经营经验。
          </Paragraph>
          <Row gutter={[12, 12]} className="student-filter-row">
            <Col xs={12} lg={4}>
              <Select className="full-width" value={filters.timeRange} onChange={(value) => updateFilter("timeRange", value)} options={["近3个月", "近6个月", "近1年", "全部"].map((item) => ({ value: item, label: `时间：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={filters.country} onChange={(value) => updateFilter("country", value)} options={["全部", "美国", "英国", "加拿大", "多国家"].map((item) => ({ value: item, label: `国家：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={filters.stage} onChange={(value) => updateFilter("stage", value)} options={["全部", "初中", "高中", "本科"].map((item) => ({ value: item, label: `阶段：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={filters.firstProduct} onChange={(value) => updateFilter("firstProduct", value)} options={["全部", "学科培训", "语陪", "升学规划", "背景提升"].map((item) => ({ value: item, label: `首单：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Select className="full-width" value={filters.successType} onChange={(value) => updateFilter("successType", value)} options={["全部", "多产品组合", "客诉挽回", "长期规划", "高续费", "转介绍"].map((item) => ({ value: item, label: `类型：${item}` }))} />
            </Col>
            <Col xs={12} lg={4}>
              <Button className="full-width" onClick={() => setFilters({ timeRange: "近1年", country: "全部", stage: "全部", firstProduct: "全部", successType: "全部" })}>重置筛选</Button>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={3}><Statistic title="成功客户数" value={activeCases.length} suffix="人" valueStyle={{ color: "#1b63d9" }} /></Col>
            <Col xs={12} lg={3}><Statistic title="平均累计消费" value={avgAmount} prefix="¥" suffix="万" /></Col>
            <Col xs={12} lg={3}><Statistic title="平均消费周期" value={avgCycle} suffix="天" /></Col>
            <Col xs={12} lg={3}><Statistic title="平均产品数" value={avgProductCount} suffix="个" /></Col>
            <Col xs={12} lg={3}><Statistic title="续费/加购率" value={renewalRate} suffix="%" /></Col>
            <Col xs={12} lg={3}><Statistic title="转介绍贡献率" value={referralRate} suffix="%" /></Col>
            <Col xs={12} lg={3}><Statistic title="客诉挽回/闭环" value={recoveryRate} suffix="%" /></Col>
            <Col xs={12} lg={3}><Statistic title="核心规律" value="路径经营" /></Col>
          </Row>
          <Alert
            className="section-alert"
            type="info"
            showIcon
            message={aiGenerated ? "AI复盘总结已生成" : "AI经营洞察"}
            description={`当前筛选下的10W+成功客户以${stageDistribution[0]?.name || "高中"}阶段和${countryDistribution[0]?.name || "英美"}方向为主，常见路径是“${productCombos[0]?.name || "课程类产品 + 规划 + 背景提升"}”。成功关键通常来自家长深度参与、阶段成果可视化和多产品路径承接。`}
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="他们是谁：画像分布">
          <DistributionList title="学生阶段" data={stageDistribution} onPick={(name) => updateFilter("stage", name)} />
          <DistributionList title="目标国家" data={countryDistribution} onPick={(name) => updateFilter("country", name)} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="他们从哪里来">
          <DistributionList title="客户来源" data={sourceDistribution} />
          <DistributionList title="首单入口" data={firstProductDistribution} onPick={(name) => updateFilter("firstProduct", name)} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="成功规律解释">
          <div className="insight-copy">
            <Text strong>不是简单识别有钱客户，而是复盘成功路径。</Text>
            <Paragraph>
              10W+客户通常先形成服务信任，再通过规划、背景提升、文书、营地等产品形成连续经营。页面重点展示“为什么买、怎么买、我们做对了什么”。
            </Paragraph>
          </div>
          <Space size={[8, 8]} wrap>
            <Tag color="blue">家长参与</Tag>
            <Tag color="green">目标明确</Tag>
            <Tag color="cyan">路径承接</Tag>
            <Tag color="purple">服务复盘</Tag>
          </Space>
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="他们怎么消费到10W+：典型消费路径">
          <div className="path-flow-list">
            {productCombos.slice(0, 4).map((item) => (
              <button className="path-flow-row" key={item.id} type="button">
                <span className="path-flow-main">{item.name}</span>
                <span className="path-flow-meta">¥{item.total}万 · {item.cycle}天 · {item.stage}</span>
              </button>
            ))}
          </div>
          <Steps
            className="high-value-steps"
            size="small"
            items={[
              { title: "首单建立信任", description: "课程/规划入口" },
              { title: "阶段复盘", description: "证明服务价值" },
              { title: "路径诊断", description: "承接长期目标" },
              { title: "组合加购", description: "背景提升/申请/续排" },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="哪些组合最容易形成10W+">
          <List
            size="small"
            dataSource={productCombos.slice(0, 5)}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={`平均贡献 ¥${item.total}万，适用：${item.fit}`}
                />
                <Tag color="blue">{item.cycle}天</Tag>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="为什么成功：成功因子排行">
          <div className="factor-list">
            {factorRows.map((item) => (
              <div className="factor-row" key={item.factor}>
                <div>
                  <Text strong>{item.factor}</Text>
                  <Text type="secondary">{item.suggestion}</Text>
                </div>
                <Progress type="circle" percent={item.percent} size={58} />
              </div>
            ))}
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="我们做对了什么：服务动作复盘">
          <Table
            rowKey="action"
            size="small"
            columns={[
              { title: "服务动作", dataIndex: "action", width: 120 },
              { title: "出现比例", dataIndex: "percent", width: 120, render: (value) => <Progress percent={value} size="small" /> },
              { title: "主责角色", dataIndex: "role", width: 110, render: (value) => <Tag>{value}</Tag> },
              { title: "业务价值", dataIndex: "value" },
            ]}
            dataSource={serviceActions}
            pagination={false}
          />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="典型成功分群">
          <Row gutter={[12, 12]}>
            {[
              ["名校强目标型", "目标明确、排名敏感、愿意为规划和背景提升投入。", "用差距诊断驱动长期方案。"],
              ["家长焦虑决策型", "家长深度参与，担心错过申请或提升窗口。", "高频复盘，用阶段证据稳定信任。"],
              ["长期规划成长型", "低龄或早规划客户，周期长、产品延展空间大。", "按年级拆解目标，季度复盘推进。"],
              ["服务信任加购型", "先买小产品，体验稳定后逐步加购。", "先交付结果，再承接下一阶段。"],
              ["客诉修复转化型", "中途出现不满，通过补救建立更强信任。", "主管介入，先修复关系再谈后续。"],
            ].map(([title, desc, tactic]) => (
              <Col xs={24} md={12} xl={8} key={title}>
                <div className="segment-card">
                  <Tag color="blue">{title}</Tag>
                  <Paragraph>{desc}</Paragraph>
                  <Text strong>复用打法：{tactic}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="历史10W+成功案例列表" extra={<Tag color="blue">用于复盘与打法沉淀</Tag>}>
          <Table rowKey="id" size="small" columns={caseColumns} dataSource={activeCases} pagination={false} scroll={{ x: 1420 }} />
        </Card>
      </Col>
    </Row>
  );
}

function DistributionList({ title, data, onPick }) {
  return (
    <div className="distribution-block">
      <Text strong>{title}</Text>
      <List
        size="small"
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            <Button type="link" onClick={() => onPick?.(item.name)}>{item.name}</Button>
            <Progress className="list-progress" percent={item.percent} size="small" />
          </List.Item>
        )}
      />
    </div>
  );
}

function RolesPage({ go }) {
  const rows = [
    ["班主任", "安抚风险用户，更新学习反馈和回访节点。", "complaint", roleTasks.filter((item) => item.role === "班主任").length],
    ["顾问", "跟进10W+画像匹配用户路径诊断。", "renewal", roleTasks.filter((item) => item.role === "顾问").length],
    ["教务", "处理老师匹配、排课调整和试听安排。", "complaint", roleTasks.filter((item) => item.role === "教务").length],
    ["教师", "查看课前风险摘要，调整课堂节奏。", "profile", roleTasks.filter((item) => item.role === "教师").length],
    ["升学规划", "输出海外本科三年规划诊断。", "renewal", roleTasks.filter((item) => item.role === "升学规划").length],
    ["主管", "处理红黑客诉池，复盘服务承诺。", "complaint", roleTasks.filter((item) => item.role === "主管").length],
  ];
  const taskColumns = [
    { title: "角色", dataIndex: "role", width: 100, render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "用户", dataIndex: "user", width: 110 },
    { title: "AI分发任务", dataIndex: "task" },
    { title: "来源", dataIndex: "source", width: 140 },
    { title: "截止", dataIndex: "due", width: 120 },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (value) => {
        const color = value === "高优先级" ? "red" : value === "处理中" ? "processing" : value === "待依赖" ? "gold" : "default";
        return <Tag color={color}>{value}</Tag>;
      },
    },
    { title: "动作", dataIndex: "route", width: 90, render: (_, record) => <Button type="link" onClick={() => go(record.route, record.userId)}>查看</Button> },
  ];
  return (
    <Row gutter={[16, 16]}>
      {rows.map(([role, desc, target, count]) => (
        <Col xs={24} md={12} xl={8} key={role}>
          <Card title={role} extra={<Badge count={count} showZero />}>
            <Space direction="vertical" className="full-width">
              <Text type="secondary">{desc}</Text>
              <Button type="link" onClick={() => go(target)}>进入相关场景</Button>
            </Space>
          </Card>
        </Col>
      ))}
      <Col span={24}>
        <Card
          title="AI角色待办分发"
          extra={<Tag color="blue">服务动作从客诉/续费/学情自动生成</Tag>}
        >
          <Table rowKey="key" size="small" columns={taskColumns} dataSource={roleTasks} pagination={false} scroll={{ x: 980 }} />
        </Card>
      </Col>
    </Row>
  );
}

function CasesPage() {
  const caseColumns = [
    { title: "类型", dataIndex: "type", width: 140, render: (value) => <Tag color={value === "失败案例" ? "red" : "blue"}>{value}</Tag> },
    { title: "案例", dataIndex: "title", width: 180 },
    { title: "适用场景", dataIndex: "scene" },
    { title: "结果", dataIndex: "result" },
    { title: "可复用策略", dataIndex: "reusable" },
  ];
  const positiveCases = knowledgeCases.filter((item) => item.type !== "失败案例");
  const negativeCases = knowledgeCases.filter((item) => item.type === "失败案例");
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="案例库如何服务AI建议" extra={<Tag color="blue">从经验到规则</Tag>}>
          <Steps
            items={[
              { title: "人工复盘", description: "沉淀成功/失败案例" },
              { title: "结构化标签", description: "场景、证据、动作、边界" },
              { title: "相似检索", description: "匹配当前用户状态" },
              { title: "生成建议", description: "输出SOP、话术和任务" },
            ]}
          />
        </Card>
      </Col>
      <Col span={24}>
        <Tabs
          items={[
            {
              key: "cases",
              label: "典型案例",
              children: <Table rowKey="title" size="small" columns={caseColumns} dataSource={knowledgeCases} pagination={false} scroll={{ x: 1080 }} />,
            },
            {
              key: "success",
              label: "可复用成功策略",
              children: <List dataSource={positiveCases} renderItem={(item) => <List.Item><List.Item.Meta title={item.title} description={`${item.scene}｜${item.reusable}`} /><Tag color="green">{item.result}</Tag></List.Item>} />,
            },
            {
              key: "avoid",
              label: "禁用动作",
              children: <List dataSource={negativeCases} renderItem={(item) => <List.Item><List.Item.Meta title={item.title} description={item.reusable} /><Tag color="red">{item.result}</Tag></List.Item>} />,
            },
          ]}
        />
      </Col>
      <Col xs={24} lg={12}>
        <Card title="当前用户引用样例">
          <Alert
            type="info"
            showIcon
            message="陈思远匹配：课程信任到规划牵引"
            description="AI建议先由班主任输出阶段成果，再安排升学规划路径诊断，最后由顾问承接规划+竞赛+营地组合。"
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="案例入库字段">
          <ProductTags items={["用户阶段", "已购产品", "客诉等级", "触发词", "处理动作", "补偿边界", "结果", "复盘标签"]} />
        </Card>
      </Col>
    </Row>
  );
}

function StrategyPage() {
  const ruleColumns = [
    { title: "模块", dataIndex: "module", width: 120, render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "策略规则", dataIndex: "rule" },
    { title: "负责人", dataIndex: "owner", width: 120 },
    { title: "状态", dataIndex: "status", width: 100, render: (value) => <Badge status={value === "启用" ? "success" : "warning"} text={value} /> },
  ];
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="策略中心定位" extra={<Tag color="blue">让AI建议可控、可解释、可迭代</Tag>}>
          <Alert
            type="info"
            showIcon
            message="策略中心不是单独给客户看的页面，而是内部员工助手的规则后台。"
            description="它把客诉定级、续费推荐、10W+画像、补偿边界和话术禁忌统一管理，避免AI只会生成建议但无法被业务约束。"
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="策略输入">
          <Timeline
            items={[
              { children: "历史10W+成功案例与失败案例" },
              { children: "现有客诉SOP和补偿规则" },
              { children: "企微沟通触发词与情绪变化" },
              { children: "订单、成绩、课程、报考和课消数据" },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="策略输出">
          <List
            size="small"
            dataSource={["客诉等级建议", "处理SOP", "角色待办", "续费产品推荐", "禁用动作提醒", "复盘标签"]}
            renderItem={(item) => <List.Item><CheckCircleOutlined className="success-icon" />{item}</List.Item>}
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="人工控制点">
          <List
            size="small"
            dataSource={["红黑客诉必须主管确认", "退款赔偿必须经理审批", "销售推进受客诉等级约束", "策略变更保留版本记录"]}
            renderItem={(item) => <List.Item><Tag color="gold">控制</Tag>{item}</List.Item>}
          />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="当前策略规则">
          <Table rowKey="key" size="small" columns={ruleColumns} dataSource={strategyRules} pagination={false} scroll={{ x: 980 }} />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="下一步产品化方向">
          <Steps
            items={[
              { title: "策略配置", description: "把SOP文档拆成可配置规则" },
              { title: "审批流", description: "红黑客诉与补偿动作留痕" },
              { title: "效果复盘", description: "跟踪降级率、续费率、满意度" },
              { title: "策略迭代", description: "从案例库自动发现新规则" },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}

export function App() {
  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, colorPrimary: "#1b63d9", fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif' } }}>
      <AntApp>
        <AppShell />
      </AntApp>
    </ConfigProvider>
  );
}

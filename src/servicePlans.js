export function getServicePlanItems(entry = {}, legacyId = "legacy") {
  if (Array.isArray(entry.items)) {
    return entry.items.filter((item) => item && typeof item.id === "string" && typeof item.text === "string");
  }
  return typeof entry.plan === "string" && entry.plan ? [{ id: legacyId, text: entry.plan }] : [];
}

export function serializeServicePlanItems(items) {
  return items.map((item) => ({ id: item.id, text: item.text.trim() }));
}

const monthlySamplePlans = [
  ["梳理本年度学习目标，与家长确认重点学科和阶段安排。", "回顾上学期成绩，制定寒假练习与复习计划。"],
  ["跟进寒假学习完成情况，记录薄弱知识点。", "开学前核对课程安排，确认每周学习时间。"],
  ["回访开学适应情况，跟进出勤和作业完成情况。", "安排阶段学情沟通，确认本月需要加强的学科。"],
  ["跟进阶段测评结果，与任课老师梳理错题和提升重点。", "与家长沟通近期学习表现，调整后续课程节奏。"],
  ["核对考试时间与备考进度，制定考前复习安排。", "跟进语言学习情况，确认模考和专项练习计划。"],
  ["汇总学期成绩与老师反馈，开展阶段学习复盘。", "确认暑期学习目标和课程安排，核对可用时间。"],
  ["跟进暑期课程出勤与练习情况，每周记录学习反馈。", "梳理目标院校和专业方向，核对申请要求。"],
  ["回顾暑期学习成果，确认新学期需要衔接的内容。", "核对语言考试及活动安排，整理后续跟进事项。"],
  ["回访新学期开学情况，确认选课、考试局和学习目标。", "与家长沟通课程进度，跟进作业和阶段测评表现。"],
  ["跟进本月考试准备情况，核对重点科目的复习进度。", "检查目标院校申请节点，提醒准备所需材料。"],
  ["跟进阶段成绩和语言考试结果，更新学习提升计划。", "核对申请材料准备进度，跟进待补充事项。"],
  ["开展年度服务复盘，汇总学习成果与待提升问题。", "与家长确认下一年度目标，制定寒假跟进安排。"],
];

export function getSampleServicePlanEntry(studentId, year, month) {
  return { items: (monthlySamplePlans[month - 1] || []).map((text, index) => ({
    id: `sample-${studentId}-${year}-${month}-${index}`, text,
  })) };
}

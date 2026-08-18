export const en = {
  page: {
    title: "Knowledge Base Dashboard",
    metaTitle: "KB Dashboard | TailAdmin",
    metaDescription:
      "Knowledge base dashboard with per-block API wiring, mock switching, translations, and dark mode.",
    subtitle:
      "Track content health, discover search demand, and surface articles that need attention.",
    badge: "Mock data preview",
    syncLabel: "Last sync",
    theme: "Theme",
    sourceTitle: "Data source",
  },
  summary: {
    coverage: "Coverage score",
    health: "Content health",
    searches: "Search demand",
    sla: "Response SLA",
  },
  metrics: {
    published: {
      title: "Articles Published",
      description: "Total visible knowledge base articles",
    },
    approved: {
      title: "Approved",
      description: "Articles approved and ready for publishing workflow",
    },
    submitted: {
      title: "Submitted",
      description: "Articles or requests submitted into the review flow",
    },
    expiringSoon: {
      title: "Expiring Soon",
      description: "Articles approaching the expiry window and needing review",
    },
    expired: {
      title: "Expired",
      description: "Articles that already passed the expiry threshold",
    },
    totalViews: {
      title: "Total Views",
      description: "All article views captured in the selected period",
    },
    activeUsers: {
      title: "Active Users",
      description: "Editors and reviewers active in the workspace",
    },
    avgRating: {
      title: "AVG Rating",
      description: "Reader sentiment from recent article feedback",
    },
  },
  sections: {
    metrics: {
      title: "Overview metrics",
      description: "Core KPIs from the current knowledge base workspace",
    },
    trend: {
      title: "Views Trend",
      description: "Monthly article traffic across the knowledge base",
    },
    categories: {
      title: "Top 5 Category For This Week",
      description: "Weekly category ranking by article traffic share",
    },
    searches: {
      title: "Top Search For This Week",
      description: "Most searched keywords in the current week",
    },
    articles: {
      title: "Top Articles / Latest / Popular",
      description: "Top article list ordered for the current dashboard view",
    },
    activity: {
      title: "Low Rating Articles",
      description: "Recent publishing and review activity",
    },
    lowScore: {
      title: "Low Average Score Articles",
      description:
        "Articles with below-average reader ratings — flagged for content review and improvement.",
    },
    lowView: {
      title: "Low Viewer Articles",
      description:
        "Articles with the fewest views — consider improving titles, links, or discoverability.",
    },
  },
  labels: {
    vsLastPeriod: "vs last period",
    share: "share",
    hits: "hits",
    views: "views",
    likes: "likes",
    bookmarks: "bookmarks",
    avgScore: "Avg Score",
    updated: "Updated",
    articles: "articles",
    loading: "Loading dashboard...",
    loadFailed: "Unable to load dashboard data.",
    apiPath: "API path",
    source: "Source",
    mock: "Mock",
    api: "API",
    noData: "No data available",
  },
  buttons: {
    refresh: "Refresh",
    refreshing: "Refreshing...",
  },
  status: {
    published: "Published",
    review: "In review",
    draft: "Draft",
  },
  content: {
    categories: {
      "getting-started": { label: "Getting Started" },
      troubleshooting: { label: "Troubleshooting" },
      billing: { label: "Billing" },
      automation: { label: "Automation" },
      security: { label: "Security" },
    },
    searches: {
      sso: { label: "SSO login" },
      "reset-password": { label: "Reset password" },
      workflow: { label: "Approval workflow" },
      "mobile-app": { label: "Mobile app setup" },
      permissions: { label: "Role permission" },
    },
    articles: {
      "kb-101": { title: "Configure SSO and domain mapping" },
      "kb-204": { title: "Troubleshoot intermittent agent disconnects" },
      "kb-331": { title: "Set up article approval rules by team" },
    },
    activity: {
      "act-1": {
        title: "Billing onboarding guide updated",
        detail: "Reviewed by Support Enablement and republished to production.",
        at: "12 min ago",
      },
      "act-2": {
        title: "Permission matrix article awaiting approval",
        detail: "Waiting for final legal review before publication.",
        at: "48 min ago",
      },
      "act-3": {
        title: "Search intent cluster regenerated",
        detail:
          "Top search keywords recalculated from the latest weekly traffic.",
        at: "1 hr ago",
      },
    },
  },
};

export const th = {
  page: {
    title: "แดชบอร์ดคลังความรู้",
    metaTitle: "แดชบอร์ด KB | TailAdmin",
    metaDescription:
      "แดชบอร์ดคลังความรู้ที่รองรับการผูก API รายบล็อก สลับ mock ได้ แปลภาษาได้ และรองรับ dark mode",
    subtitle:
      "ติดตามสุขภาพคอนเทนต์ ดูความต้องการจากการค้นหา และหาบทความที่ควรได้รับการดูแลต่อ",
    badge: "ตัวอย่างข้อมูลจำลอง",
    syncLabel: "ซิงก์ล่าสุด",
    theme: "ธีม",
    sourceTitle: "แหล่งข้อมูล",
  },
  summary: {
    coverage: "คะแนนความครอบคลุม",
    health: "สุขภาพคอนเทนต์",
    searches: "ดีมานด์การค้นหา",
    sla: "SLA การตอบกลับ",
  },
  metrics: {
    published: {
      title: "บทความที่เผยแพร่แล้ว",
      description: "จำนวนบทความที่แสดงผลในคลังความรู้",
    },
    approved: {
      title: "บทความที่อนุมัติแล้ว",
      description: "จำนวนบทความที่ผ่านการอนุมัติและพร้อมเข้าสู่การเผยแพร่",
    },
    submitted: {
      title: "รายการที่ส่งเข้าระบบ",
      description: "จำนวนบทความหรือคำขอที่ถูกส่งเข้าสู่ขั้นตอนรีวิว",
    },
    expiringSoon: {
      title: "ใกล้หมดอายุ",
      description: "จำนวนบทความที่ใกล้ถึงช่วงหมดอายุและควรรีวิว",
    },
    expired: {
      title: "บทความหมดอายุ",
      description: "จำนวนบทความที่เลยเกณฑ์วันหมดอายุแล้ว",
    },
    totalViews: {
      title: "ยอดเข้าชมรวม",
      description: "ยอดเข้าชมบทความทั้งหมดในช่วงเวลาปัจจุบัน",
    },
    activeUsers: {
      title: "ผู้ใช้งานที่กำลังทำงาน",
      description: "จำนวนผู้เขียนและผู้รีวิวที่กำลังใช้งานอยู่",
    },
    avgRating: {
      title: "คะแนนเฉลี่ย",
      description: "ความพึงพอใจจากฟีดแบ็กของผู้อ่านล่าสุด",
    },
  },
  sections: {
    metrics: {
      title: "ตัวชี้วัดภาพรวม",
      description: "KPI หลักของพื้นที่ทำงานคลังความรู้ปัจจุบัน",
    },
    trend: {
      title: "แนวโน้มยอดเข้าชม",
      description: "ทราฟฟิกบทความรายเดือนของคลังความรู้",
    },
    categories: {
      title: "5 หมวดหมู่ยอดนิยมประจำสัปดาห์",
      description: "อันดับหมวดหมู่ตามสัดส่วนยอดเข้าชมในสัปดาห์นี้",
    },
    searches: {
      title: "คำค้นหายอดนิยมประจำสัปดาห์",
      description: "คีย์เวิร์ดที่ถูกค้นหามากที่สุดในสัปดาห์นี้",
    },
    articles: {
      title: "บทความเด่น / ล่าสุด / ยอดนิยม",
      description: "รายการบทความที่จัดลำดับสำหรับมุมมองแดชบอร์ดปัจจุบัน",
    },
    activity: {
      title: "บทความคะแนนต่ำ",
      description: "กิจกรรมการเผยแพร่และตรวจสอบล่าสุด",
    },
    lowScore: {
      title: "บทความคะแนนเฉลี่ยต่ำ",
      description:
        "บทความที่ได้รับคะแนนต่ำกว่าเกณฑ์ — ควรปรับปรุงคุณภาพและความชัดเจนของเนื้อหา",
    },
    lowView: {
      title: "บทความยอดเข้าชมต่ำ",
      description:
        "บทความที่มียอดเข้าชมน้อยที่สุด — พิจารณาปรับปรุงชื่อเรื่อง ลิงก์ หรือการค้นพบ",
    },
  },
  labels: {
    vsLastPeriod: "เทียบรอบก่อนหน้า",
    share: "สัดส่วน",
    hits: "ครั้ง",
    avgScore: "คะแนนเฉลี่ย",
    views: "วิว",
    likes: "ไลก์",
    bookmarks: "บุ๊กมาร์ก",
    updated: "อัปเดต",
    articles: "บทความ",
    loading: "กำลังโหลดแดชบอร์ด...",
    loadFailed: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
    apiPath: "เส้นทาง API",
    source: "แหล่งข้อมูล",
    mock: "ข้อมูลจำลอง",
    api: "API",
    noData: "ไม่มีข้อมูลสำหรับแสดงผล",
  },
  buttons: {
    refresh: "รีเฟรช",
    refreshing: "กำลังรีเฟรช...",
  },
  status: {
    published: "เผยแพร่แล้ว",
    review: "กำลังรีวิว",
    draft: "ฉบับร่าง",
  },
  content: {
    categories: {
      "getting-started": { label: "เริ่มต้นใช้งาน" },
      troubleshooting: { label: "การแก้ปัญหา" },
      billing: { label: "การเรียกเก็บเงิน" },
      automation: { label: "ระบบอัตโนมัติ" },
      security: { label: "ความปลอดภัย" },
    },
    searches: {
      sso: { label: "เข้าสู่ระบบ SSO" },
      "reset-password": { label: "รีเซ็ตรหัสผ่าน" },
      workflow: { label: "ขั้นตอนการอนุมัติ" },
      "mobile-app": { label: "ตั้งค่าแอปมือถือ" },
      permissions: { label: "สิทธิ์ของบทบาท" },
    },
    articles: {
      "kb-101": { title: "ตั้งค่า SSO และการแมปโดเมน" },
      "kb-204": { title: "แก้ปัญหาเอเจนต์หลุดการเชื่อมต่อเป็นช่วง ๆ" },
      "kb-331": { title: "กำหนดกฎการอนุมัติบทความตามทีม" },
    },
    activity: {
      "act-1": {
        title: "อัปเดตคู่มือเริ่มต้นใช้งานระบบเรียกเก็บเงิน",
        detail: "ตรวจทานโดยทีม Support Enablement และเผยแพร่ขึ้นระบบแล้ว",
        at: "12 นาทีที่แล้ว",
      },
      "act-2": {
        title: "บทความตารางสิทธิ์กำลังรอการอนุมัติ",
        detail: "กำลังรอการตรวจทานขั้นสุดท้ายจากฝ่ายกฎหมายก่อนเผยแพร่",
        at: "48 นาทีที่แล้ว",
      },
      "act-3": {
        title: "สร้างกลุ่มเจตนาการค้นหาใหม่แล้ว",
        detail: "คำนวณคีย์เวิร์ดยอดค้นหาจากทราฟฟิกล่าสุดประจำสัปดาห์ใหม่แล้ว",
        at: "1 ชั่วโมงที่แล้ว",
      },
    },
  },
};

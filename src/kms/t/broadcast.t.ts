export const en = {
  page: {
    title: "Broadcast Manager",
    metaTitle: "Broadcast Manager | TailAdmin",
    metaDescription:
      "Broadcast manager page with summary filters, list block, mock data, and per-block API wiring.",
    subtitle:
      "Manage announcement broadcasts, review status distribution, and monitor active schedules from one workspace.",
  },
  sections: {
    summary: {
      title: "Status Overview",
      description: "Quick filters for each broadcast state",
    },
    list: {
      title: "Broadcast",
      description: "Showing broadcasts for {{status}}",
    },
    log: {
      title: "Broadcast History",
      description: "{{total}} total records across all announcements",
    },
  },
  labels: {
    loading: "Loading broadcast data...",
    loadingNotice: "Loading notice from API...",
    loadFailed: "Unable to load broadcast data.",
    loadNoticeFailed: "Unable to load notice from API.",
    empty: "No broadcasts found for this filter.",
    noResults: "No results match your search.",
    alertDetail: "Alert Detail",
    entryNotice: "First Visit Notice",
    noticeAcknowledgement:
      "This acknowledgement is stored in your browser. You will be prompted again when new broadcasts are available.",
    message: "Message",
    status: "Status",
    dateRange: "Date Range",
    apiPath: "API path",
    source: "Source",
    mock: "Mock",
    api: "API",
  },
  buttons: {
    add: "Add Broadcast",
    accept: "Accept and continue",
    edit: "Edit broadcast",
    delete: "Delete broadcast",
    retry: "Retry",
    cancel: "Cancel",
    create: "Create Broadcast",
    update: "Save Changes",
    saving: "Saving...",
    refresh: "Refresh",
    refreshing: "Refreshing...",
  },
  form: {
    createTitle: "Create Broadcast",
    editTitle: "Edit Broadcast",
    description:
      "Configure title, status, and active dates for the broadcast message.",
    title: "Broadcast title",
    message: "Message",
    status: "Status",
    startDate: "Start date",
    endDate: "End date",
    validationTitle: "Please enter a title",
    validationMessage: "Please enter a message",
    validationStartDate: "Please select a start date",
    validationEndDate: "Please select an end date",
    validationStartDateRequired: "Please select a start date to pair with the end date",
    validationEndDateRequired: "Please select an end date to pair with the start date",
    validationDateOrder:
      "End date must be the same day or later than start date",
  },
  confirm: {
    delete: 'Delete "{{title}}"?',
    deleteDescription: "This action cannot be undone.",
  },
  toast: {
    createSuccess: "Broadcast created successfully.",
    createError: "Unable to create the broadcast.",
    updateSuccess: "Broadcast updated successfully.",
    updateError: "Unable to update the broadcast.",
    deleteSuccess: "Broadcast deleted successfully.",
    deleteError: "Unable to delete the broadcast.",
  },
  status: {
    all: "All",
    scheduled: "Scheduled",
    published: "Published",
    expired: "Expired",
    draft: "Draft",
  },
  content: {
    items: {
      "bc-001": {
        title:
          "Check validation involves making sure all your tags are properly closed and nested.",
        message:
          "Check validation involves making sure all your tags are properly closed and nested before publishing the broadcast to users.",
      },
      "bc-002": {
        title: "Confirm recipient segment before scheduling.",
        message:
          "Confirm the audience segment before scheduling the broadcast for the next release window.",
      },
      "bc-003": {
        title: "Review links and attachments.",
        message:
          "Review all outbound links and attachments to avoid broken references in the final announcement.",
      },
      "bc-004": {
        title:
          "Platform release notice for the next scheduled maintenance window.",
        message:
          "Platform release notice for the next scheduled maintenance window.",
      },
      "bc-005": {
        title: "Broadcast campaign ended after the December knowledge push.",
        message: "Broadcast campaign ended after the December knowledge push.",
      },
      "bc-006": {
        title:
          "Draft reminder for editors to review unpublished announcements.",
        message:
          "Draft reminder for editors to review unpublished announcements.",
      },
    },
  },
  pageLog: {
    eyebrow: "Broadcast",
    title: "Broadcast History",
    metaTitle: "Broadcast History | TailAdmin",
    metaDescription:
      "Review all historical broadcast announcements sent across all channels.",
    subtitle:
      "Browse and review all historical broadcast announcements that have been sent, scheduled, or recorded across all channels.",
  },
  log: {
    searchPlaceholder: "Search by title or message...",
    publishedAt: "Published At",
    audience: "Audience",
    startDate: "Start Date",
    endDate: "End Date",
  },
};

export const th = {
  page: {
    title: "จัดการข้อความ Broadcast",
    metaTitle: "จัดการ Broadcast | TailAdmin",
    metaDescription:
      "หน้าจัดการ Broadcast ที่มีตัวกรองสรุป รายการประกาศ ข้อมูล mock และการผูก API แยกตามบล็อก",
    subtitle:
      "จัดการประกาศ ตรวจสอบการกระจายสถานะ และติดตามช่วงเวลาการเผยแพร่จากหน้าจอเดียว",
  },
  sections: {
    summary: {
      title: "ภาพรวมสถานะ",
      description: "ตัวกรองด่วนสำหรับแต่ละสถานะของ Broadcast",
    },
    list: {
      title: "Broadcast",
      description: "กำลังแสดงรายการสถานะ {{status}}",
    },
    log: {
      title: "ประวัติ Broadcast",
      description: "{{total}} รายการทั้งหมดในประวัติการประกาศ",
    },
  },
  labels: {
    loading: "กำลังโหลดข้อมูล Broadcast...",
    loadingNotice: "กำลังโหลดข้อความแจ้งเตือนจาก API...",
    loadFailed: "ไม่สามารถโหลดข้อมูล Broadcast ได้",
    loadNoticeFailed: "ไม่สามารถโหลดข้อความแจ้งเตือนจาก API ได้",
    empty: "ไม่พบรายการ Broadcast สำหรับตัวกรองนี้",
    noResults: "ไม่พบรายการที่ตรงกับคำค้นหา",
    alertDetail: "รายละเอียดการแจ้งเตือน",
    entryNotice: "แจ้งเตือนก่อนเข้าใช้งานครั้งแรก",
    noticeAcknowledgement:
      "การยอมรับนี้จะถูกจำไว้ในเบราว์เซอร์นี้ และจะแสดงใหม่เมื่อมี Broadcast ใหม่เข้ามา",
    message: "ข้อความ",
    status: "สถานะ",
    dateRange: "ช่วงวันที่",
    apiPath: "เส้นทาง API",
    source: "แหล่งข้อมูล",
    mock: "ข้อมูลจำลอง",
    api: "API",
  },
  buttons: {
    add: "เพิ่ม Broadcast ใหม่",
    accept: "ยอมรับและดำเนินการต่อ",
    edit: "แก้ไข Broadcast",
    delete: "ลบ Broadcast",
    retry: "ลองอีกครั้ง",
    cancel: "ยกเลิก",
    create: "สร้าง Broadcast",
    update: "บันทึกการแก้ไข",
    saving: "กำลังบันทึก...",
    refresh: "รีเฟรช",
    refreshing: "กำลังรีเฟรช...",
  },
  form: {
    createTitle: "เพิ่ม Broadcast",
    editTitle: "แก้ไข Broadcast",
    description: "กำหนดหัวข้อ สถานะ และช่วงวันที่ใช้งานของข้อความ Broadcast",
    title: "หัวข้อ Broadcast",
    message: "ข้อความ",
    status: "สถานะ",
    startDate: "วันที่เริ่มต้น",
    endDate: "วันที่สิ้นสุด",
    validationTitle: "กรุณากรอกหัวข้อ",
    validationMessage: "กรุณากรอกข้อความ",
    validationStartDate: "กรุณาเลือกวันที่เริ่มต้น",
    validationEndDate: "กรุณาเลือกวันที่สิ้นสุด",
    validationStartDateRequired: "กรุณาเลือกวันที่เริ่มต้นให้ครบ",
    validationEndDateRequired: "กรุณาเลือกวันที่สิ้นสุดให้ครบ",
    validationDateOrder: "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น",
  },
  confirm: {
    delete: 'ลบ "{{title}}" ใช่หรือไม่',
    deleteDescription: "การดำเนินการนี้ไม่สามารถย้อนกลับได้",
  },
  toast: {
    createSuccess: "สร้าง Broadcast สำเร็จ",
    createError: "ไม่สามารถสร้าง Broadcast ได้",
    updateSuccess: "บันทึกการแก้ไข Broadcast สำเร็จ",
    updateError: "ไม่สามารถแก้ไข Broadcast ได้",
    deleteSuccess: "ลบ Broadcast สำเร็จ",
    deleteError: "ไม่สามารถลบ Broadcast ได้",
  },
  status: {
    all: "ทั้งหมด",
    scheduled: "ตั้งเวลาไว้",
    published: "เผยแพร่แล้ว",
    expired: "หมดอายุ",
    draft: "ฉบับร่าง",
  },
  content: {
    items: {
      "bc-001": {
        title: "ตรวจสอบ validation ก่อนเผยแพร่",
        message:
          "ตรวจสอบ validation ให้แน่ใจว่าแท็กทั้งหมดถูกปิดและซ้อนกันอย่างถูกต้องก่อนเผยแพร่ข้อความ Broadcast ให้ผู้ใช้",
      },
      "bc-002": {
        title: "ยืนยันกลุ่มผู้รับก่อนตั้งเวลา",
        message:
          "ยืนยันกลุ่มเป้าหมายก่อนตั้งเวลา Broadcast สำหรับรอบ release ถัดไป",
      },
      "bc-003": {
        title: "ตรวจสอบลิงก์และไฟล์แนบ",
        message:
          "ตรวจสอบลิงก์ภายนอกและไฟล์แนบทั้งหมดเพื่อป้องกันการอ้างอิงที่เสียในประกาศฉบับสุดท้าย",
      },
      "bc-004": {
        title: "ประกาศการออกรุ่นระบบสำหรับรอบปิดปรับปรุงครั้งถัดไป",
        message: "ประกาศการออกรุ่นระบบสำหรับรอบปิดปรับปรุงครั้งถัดไป",
      },
      "bc-005": {
        title:
          "แคมเปญ Broadcast สิ้นสุดลงหลังจากการผลักดันคลังความรู้เดือนธันวาคม",
        message:
          "แคมเปญ Broadcast สิ้นสุดลงหลังจากการผลักดันคลังความรู้เดือนธันวาคม",
      },
      "bc-006": {
        title: "ฉบับร่างเตือนผู้แก้ไขให้ตรวจสอบประกาศที่ยังไม่เผยแพร่",
        message: "ฉบับร่างเตือนผู้แก้ไขให้ตรวจสอบประกาศที่ยังไม่เผยแพร่",
      },
    },
  },
  pageLog: {
    eyebrow: "Broadcast",
    title: "ประวัติ Broadcast",
    metaTitle: "ประวัติ Broadcast | TailAdmin",
    metaDescription: "ดูย้อนหลังประกาศ Broadcast ทั้งหมดที่ผ่านมาทุกช่องทาง",
    subtitle:
      "เรียกดูและตรวจสอบประกาศ Broadcast ทั้งหมดที่เผยแพร่ ตั้งเวลา หรือบันทึกไว้ในทุกช่องทาง",
  },
  log: {
    searchPlaceholder: "ค้นหาด้วยหัวข้อหรือข้อความ...",
    publishedAt: "เผยแพร่เมื่อ",
    audience: "กลุ่มเป้าหมาย",
    startDate: "วันเริ่มต้น",
    endDate: "วันสิ้นสุด",
  },
};

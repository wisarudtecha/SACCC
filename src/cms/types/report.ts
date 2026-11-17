export interface ReportItem {
  id: string;
  title: string;
  url: string;
}

export interface ReportSection {
  id: string;
  title: string;
  child: ReportItem[];
}

export interface ReportGroup {
  id: string;
  title: string;
  sections: ReportSection[];
}

export interface ReportConfig {
  /**
   * Jasper login username template, applied to the signed-in user.
   * Placeholders: `[tenant]` = `user.organization` (e.g. "SKYICT"),
   * `[username]` = `user.username` (e.g. "wisarud.tec"), so the default
   * "[tenant]_[username]" logs in as "SKYICT_wisarud.tec".
   * Rendered by buildJasperUsername() in components/report/jasperUsername.ts.
   */
  jasperUsernameFormat: string;
  /**
   * Default Jasper password per tenant name — the key is matched against
   * `user.organization` (trim + case-insensitive), e.g. "SKYICT" → "Skyict@123".
   * Jasper issues one account per tenant naming scheme with a shared password
   * per tenant, so this is not the signed-in user's own password.
   * A tenant with no entry falls back to VITE_JASPER_PASSWORD (openReport.ts)
   * and says so in the console.
   */
  jasperDefaultPasswords: Record<string, string>;
  groups: ReportGroup[];
}

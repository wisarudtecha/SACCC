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

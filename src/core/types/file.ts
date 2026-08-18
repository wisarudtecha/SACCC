export interface UploadFileRes {
  id: number;
  orgId: string;
  caseId: string;
  type: string;
  attId: string;
  attName: string;
  attUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface UploadFileInput {
  path:string;
  file:File;
  caseId?:string;
}

export interface deleteFileInput {
  attId:string;
  filename:string;
  caseId:string;
  path:string;
}
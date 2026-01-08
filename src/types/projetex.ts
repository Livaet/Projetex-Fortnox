export interface ProjetexProject {
  projectId: number;
  projectNumber: string;
  projectName: string;
  clientId: number;
  clientName: string;
  clientCode: string;
  status: string;
  jobs: ProjetexJob[];
}

export interface ProjetexJob {
  jobId: number;
  jobNumber: string;
  jobName: string;
  description: string;
  sourceLanguage: string;
  targetLanguage: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  status: string;
  completedDate?: string;
}

export interface ProjetexApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

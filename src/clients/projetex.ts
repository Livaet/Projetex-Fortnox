import axios, { AxiosInstance } from 'axios';
import { ProjetexProject, ProjetexJob, ProjetexApiResponse } from '../types/projetex';
import { Config } from '../config';

export class ProjetexClient {
  private client: AxiosInstance;
  private config: Config['projetex'];

  constructor(config: Config['projetex']) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      timeout: 30000,
    });
  }

  /**
   * Get project details by project number
   * @param projectNumber The Projetex project number
   * @returns Project details including client information and jobs
   */
  async getProject(projectNumber: string): Promise<ProjetexProject> {
    try {
      // Projetex API endpoint structure (may need adjustment based on actual API)
      const response = await this.client.get<ProjetexApiResponse<ProjetexProject>>(
        `/projects/${projectNumber}`,
        {
          params: {
            username: this.config.username,
            includeJobs: true,
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch project');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Projetex API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get all jobs for a specific project
   * @param projectId The Projetex project ID
   * @returns List of jobs in the project
   */
  async getProjectJobs(projectId: number): Promise<ProjetexJob[]> {
    try {
      const response = await this.client.get<ProjetexApiResponse<ProjetexJob[]>>(
        `/projects/${projectId}/jobs`,
        {
          params: {
            username: this.config.username,
            status: 'completed', // Only get completed jobs for billing
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch project jobs');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Projetex API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get billable jobs for a project (completed jobs that haven't been billed yet)
   * @param projectNumber The Projetex project number
   * @returns List of billable jobs
   */
  async getBillableJobs(projectNumber: string): Promise<ProjetexJob[]> {
    const project = await this.getProject(projectNumber);

    // Filter for completed jobs that are billable
    return project.jobs.filter(job =>
      job.status.toLowerCase() === 'completed' &&
      job.totalAmount > 0
    );
  }

  /**
   * Validate that a project exists and is ready for billing
   * @param projectNumber The Projetex project number
   * @returns Project if valid, throws error otherwise
   */
  async validateProjectForBilling(projectNumber: string): Promise<ProjetexProject> {
    const project = await this.getProject(projectNumber);

    if (!project.clientId || !project.clientCode) {
      throw new Error(`Project ${projectNumber} does not have a client assigned`);
    }

    const billableJobs = project.jobs.filter(job =>
      job.status.toLowerCase() === 'completed' &&
      job.totalAmount > 0
    );

    if (billableJobs.length === 0) {
      throw new Error(`Project ${projectNumber} has no billable jobs`);
    }

    return project;
  }
}

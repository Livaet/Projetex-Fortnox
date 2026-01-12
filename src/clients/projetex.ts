import * as sql from 'mssql';
import { ProjetexProject, ProjetexJob } from '../types/projetex';
import { Config } from '../config';

export class ProjetexClient {
  private config: Config['projetex'];
  private pool: sql.ConnectionPool | null = null;

  constructor(config: Config['projetex']) {
    this.config = config;
  }

  /**
   * Get or create database connection pool
   */
  private async getPool(): Promise<sql.ConnectionPool> {
    if (this.pool && this.pool.connected) {
      return this.pool;
    }

    const config: sql.config = {
      server: this.config.server,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      options: {
        encrypt: true,
        trustServerCertificate: this.config.trustServerCertificate,
      },
      connectionTimeout: 30000,
      requestTimeout: 30000,
    };

    this.pool = await sql.connect(config);
    return this.pool;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  /**
   * Get project details by project number
   * @param projectNumber The Projetex project number
   * @returns Project details including client information and jobs
   */
  async getProject(projectNumber: string): Promise<ProjetexProject> {
    try {
      const pool = await this.getPool();

      // Query project information
      // Note: Table and column names may need adjustment based on your Projetex schema
      const projectQuery = `
        SELECT
          p.idProject as projectId,
          p.ProjectNo as projectNumber,
          p.ProjectName as projectName,
          p.idClient as clientId,
          c.ClientName as clientName,
          c.ClientCode as clientCode,
          p.Status as status
        FROM Projects p
        LEFT JOIN Clients c ON p.idClient = c.idClient
        WHERE p.ProjectNo = @projectNumber
      `;

      const projectResult = await pool.request()
        .input('projectNumber', sql.NVarChar, projectNumber)
        .query(projectQuery);

      if (projectResult.recordset.length === 0) {
        throw new Error(`Project ${projectNumber} not found`);
      }

      const projectData = projectResult.recordset[0];

      // Query jobs for this project
      const jobs = await this.getProjectJobs(projectData.projectId);

      return {
        projectId: projectData.projectId,
        projectNumber: projectData.projectNumber,
        projectName: projectData.projectName,
        clientId: projectData.clientId,
        clientName: projectData.clientName || '',
        clientCode: projectData.clientCode || '',
        status: projectData.status || '',
        jobs: jobs,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Projetex database error: ${error.message}`);
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
      const pool = await this.getPool();

      // Query jobs/tasks for the project
      // Note: Table and column names may need adjustment based on your Projetex schema
      const jobsQuery = `
        SELECT
          j.idJob as jobId,
          j.JobNo as jobNumber,
          j.JobName as jobName,
          j.Description as description,
          j.SourceLanguage as sourceLanguage,
          j.TargetLanguage as targetLanguage,
          j.Quantity as quantity,
          j.Unit as unit,
          j.PricePerUnit as pricePerUnit,
          j.TotalAmount as totalAmount,
          j.Status as status,
          j.CompletedDate as completedDate
        FROM Jobs j
        WHERE j.idProject = @projectId
        ORDER BY j.JobNo
      `;

      const jobsResult = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(jobsQuery);

      return jobsResult.recordset.map(row => ({
        jobId: row.jobId,
        jobNumber: row.jobNumber || '',
        jobName: row.jobName || '',
        description: row.description || '',
        sourceLanguage: row.sourceLanguage || '',
        targetLanguage: row.targetLanguage || '',
        quantity: parseFloat(row.quantity) || 0,
        unit: row.unit || 'pcs',
        pricePerUnit: parseFloat(row.pricePerUnit) || 0,
        totalAmount: parseFloat(row.totalAmount) || 0,
        status: row.status || '',
        completedDate: row.completedDate ? row.completedDate.toISOString() : undefined,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Projetex database error: ${error.message}`);
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
      (job.status.toLowerCase() === 'completed' ||
       job.status.toLowerCase() === 'done' ||
       job.status.toLowerCase() === 'finished') &&
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
      (job.status.toLowerCase() === 'completed' ||
       job.status.toLowerCase() === 'done' ||
       job.status.toLowerCase() === 'finished') &&
      job.totalAmount > 0
    );

    if (billableJobs.length === 0) {
      throw new Error(`Project ${projectNumber} has no billable jobs`);
    }

    return project;
  }

  /**
   * Test database connection
   * @returns true if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const result = await pool.request().query('SELECT 1 as test');
      return result.recordset.length > 0;
    } catch (error) {
      throw new Error(`Failed to connect to Projetex database: ${error}`);
    }
  }
}

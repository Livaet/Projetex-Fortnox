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

      // Query project information using actual Projetex 3D schema
      const projectQuery = `
        SELECT
          p.PROJ_ID as projectId,
          p.PROJ_NUMB as projectNumber,
          p.PROJ_NAME as projectName,
          p.CLIENT_ID as clientId,
          c.CLIENT_NAME as clientName,
          c.CLIENT_CODE as clientCode,
          p.PROJ_IS_COMPLETED as status
        FROM Projects p
        LEFT JOIN Clients c ON p.CLIENT_ID = c.CLIENT_ID
        WHERE p.PROJ_NUMB = @projectNumber
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

      // Query jobs/tasks for the project using actual Projetex 3D schema
      const jobsQuery = `
        SELECT
          j.CJOB_ID as jobId,
          j.CJOB_NUMB as jobNumber,
          j.CJOB_NAME as jobName,
          j.CJOB_INSTRUCTION as description,
          j.CJOB_VOLUME as quantity,
          j.CJOB_PRICE as pricePerUnit,
          j.CJOB_TOTAL as totalAmount,
          j.CJOB_ISCOMPLETED as isCompleted,
          j.CJOB_COMPLETED as completedDate,
          '' as sourceLanguage,
          '' as targetLanguage,
          'units' as unit
        FROM CJOBS j
        WHERE j.PROJ_ID = @projectId
        ORDER BY j.CJOB_NUMB
      `;

      const jobsResult = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(jobsQuery);

      return jobsResult.recordset.map(row => ({
        jobId: row.jobId,
        jobNumber: row.jobNumber ? row.jobNumber.toString() : '',
        jobName: row.jobName || '',
        description: row.description || '',
        sourceLanguage: row.sourceLanguage || '',
        targetLanguage: row.targetLanguage || '',
        quantity: parseFloat(row.quantity) || 0,
        unit: row.unit || 'units',
        pricePerUnit: parseFloat(row.pricePerUnit) || 0,
        totalAmount: parseFloat(row.totalAmount) || 0,
        status: row.isCompleted ? 'completed' : 'in progress',
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

import { ProjetexClient } from '../clients/projetex';
import { FortnoxClient } from '../clients/fortnox';
import { ProjetexProject, ProjetexJob } from '../types/projetex';
import { FortnoxInvoice, FortnoxInvoiceRow, FortnoxInvoiceResponse } from '../types/fortnox';
import { Config } from '../config';

export interface BillingResult {
  success: boolean;
  projectNumber: string;
  projectName: string;
  customerNumber: string;
  invoiceNumber?: number;
  totalAmount: number;
  jobCount: number;
  error?: string;
}

export class BillingService {
  private projetexClient: ProjetexClient;
  private fortnoxClient: FortnoxClient;

  constructor(config: Config) {
    this.projetexClient = new ProjetexClient(config.projetex);
    this.fortnoxClient = new FortnoxClient(config.fortnox);
  }

  /**
   * Bill a Projetex project in Fortnox
   * This is the main method that orchestrates the entire billing process
   * @param projectNumber The Projetex project number to bill
   * @returns Billing result with invoice details
   */
  async billProject(projectNumber: string): Promise<BillingResult> {
    try {
      console.log(`\n🔍 Fetching project ${projectNumber} from Projetex...`);

      // Step 1: Validate and get project from Projetex
      const project = await this.projetexClient.validateProjectForBilling(projectNumber);

      console.log(`✅ Found project: ${project.projectName}`);
      console.log(`   Client: ${project.clientName} (${project.clientCode})`);

      // Step 2: Get billable jobs
      const billableJobs = project.jobs.filter(job =>
        job.status.toLowerCase() === 'completed' &&
        job.totalAmount > 0
      );

      console.log(`   Billable jobs: ${billableJobs.length}`);

      // Step 3: Find or validate customer in Fortnox
      console.log(`\n🔍 Looking up customer in Fortnox...`);

      const customerNumber = await this.fortnoxClient.findCustomerByClientCode(
        project.clientCode,
        project.clientName
      );

      console.log(`✅ Found customer: ${customerNumber}`);

      // Step 4: Create invoice in Fortnox
      console.log(`\n📄 Creating invoice in Fortnox...`);

      const invoice = this.buildInvoice(project, billableJobs, customerNumber);
      const invoiceResponse = await this.fortnoxClient.createInvoice(invoice);

      console.log(`✅ Invoice created successfully!`);
      console.log(`   Invoice number: ${invoiceResponse.Invoice.InvoiceNumber}`);
      console.log(`   Total amount: ${invoiceResponse.Invoice.Total} ${invoice.Currency}`);

      return {
        success: true,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        customerNumber,
        invoiceNumber: invoiceResponse.Invoice.InvoiceNumber,
        totalAmount: invoiceResponse.Invoice.Total,
        jobCount: billableJobs.length,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Billing failed: ${errorMessage}`);

      return {
        success: false,
        projectNumber,
        projectName: '',
        customerNumber: '',
        totalAmount: 0,
        jobCount: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Build a Fortnox invoice from Projetex project data
   * @param project The Projetex project
   * @param jobs The billable jobs
   * @param customerNumber The Fortnox customer number
   * @returns Fortnox invoice object
   */
  private buildInvoice(
    project: ProjetexProject,
    jobs: ProjetexJob[],
    customerNumber: string
  ): FortnoxInvoice {
    const invoiceRows: FortnoxInvoiceRow[] = jobs.map(job => ({
      Description: this.formatJobDescription(job),
      Quantity: job.quantity,
      Unit: job.unit || 'pcs',
      Price: job.pricePerUnit,
      VAT: 25, // Default Swedish VAT, adjust as needed
    }));

    const today = new Date().toISOString().split('T')[0];

    return {
      CustomerNumber: customerNumber,
      InvoiceDate: today,
      Currency: 'SEK', // Default to Swedish Krona, adjust as needed
      InvoiceRows: invoiceRows,
      Remarks: `Billing for Projetex project: ${project.projectNumber} - ${project.projectName}`,
      OurReference: project.projectNumber,
    };
  }

  /**
   * Format job description for invoice line
   * @param job The Projetex job
   * @returns Formatted description
   */
  private formatJobDescription(job: ProjetexJob): string {
    let description = `${job.jobNumber}: ${job.jobName}`;

    if (job.sourceLanguage && job.targetLanguage) {
      description += ` (${job.sourceLanguage} → ${job.targetLanguage})`;
    }

    if (job.description) {
      description += ` - ${job.description}`;
    }

    return description;
  }

  /**
   * Preview what would be billed without actually creating an invoice
   * @param projectNumber The Projetex project number
   * @returns Billing preview data
   */
  async previewBilling(projectNumber: string): Promise<{
    project: ProjetexProject;
    billableJobs: ProjetexJob[];
    totalAmount: number;
    customerNumber?: string;
  }> {
    const project = await this.projetexClient.validateProjectForBilling(projectNumber);

    const billableJobs = project.jobs.filter(job =>
      job.status.toLowerCase() === 'completed' &&
      job.totalAmount > 0
    );

    const totalAmount = billableJobs.reduce((sum, job) => sum + job.totalAmount, 0);

    let customerNumber: string | undefined;
    try {
      customerNumber = await this.fortnoxClient.findCustomerByClientCode(
        project.clientCode,
        project.clientName
      );
    } catch (error) {
      // Customer not found, but we can still show preview
      console.warn('Customer not found in Fortnox (preview only)');
    }

    return {
      project,
      billableJobs,
      totalAmount,
      customerNumber,
    };
  }
}

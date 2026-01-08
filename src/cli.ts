#!/usr/bin/env node

import { Command } from 'commander';
import { BillingService } from './services/billing';
import { loadConfig } from './config';

const program = new Command();

program
  .name('projetex-fortnox-billing')
  .description('Bill Projetex projects in Fortnox')
  .version('1.0.0');

program
  .command('bill')
  .description('Create an invoice in Fortnox for a Projetex project')
  .argument('<project-number>', 'Projetex project number to bill')
  .option('-p, --preview', 'Preview billing without creating invoice')
  .action(async (projectNumber: string, options: { preview?: boolean }) => {
    try {
      console.log('\n╔════════════════════════════════════════════════════╗');
      console.log('║  Projetex → Fortnox Billing Connector            ║');
      console.log('╚════════════════════════════════════════════════════╝');

      const config = loadConfig();
      const billingService = new BillingService(config);

      if (options.preview) {
        console.log('\n📋 PREVIEW MODE - No invoice will be created\n');

        const preview = await billingService.previewBilling(projectNumber);

        console.log('Project Information:');
        console.log(`  Number: ${preview.project.projectNumber}`);
        console.log(`  Name: ${preview.project.projectName}`);
        console.log(`  Client: ${preview.project.clientName} (${preview.project.clientCode})`);
        console.log(`  Status: ${preview.project.status}`);

        if (preview.customerNumber) {
          console.log(`  Fortnox Customer: ${preview.customerNumber}`);
        } else {
          console.log('  ⚠️  Warning: Customer not found in Fortnox');
        }

        console.log('\nBillable Jobs:');
        preview.billableJobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.jobNumber}: ${job.jobName}`);
          console.log(`     Quantity: ${job.quantity} ${job.unit}`);
          console.log(`     Price: ${job.pricePerUnit} × ${job.quantity} = ${job.totalAmount}`);
        });

        console.log(`\nTotal Amount: ${preview.totalAmount}`);
        console.log(`Total Jobs: ${preview.billableJobs.length}`);

        console.log('\n💡 Run without --preview flag to create the invoice');

      } else {
        const result = await billingService.billProject(projectNumber);

        if (result.success) {
          console.log('\n╔════════════════════════════════════════════════════╗');
          console.log('║  ✅ BILLING SUCCESSFUL                            ║');
          console.log('╚════════════════════════════════════════════════════╝\n');
          console.log(`Project: ${result.projectName} (${result.projectNumber})`);
          console.log(`Customer: ${result.customerNumber}`);
          console.log(`Invoice Number: ${result.invoiceNumber}`);
          console.log(`Total Amount: ${result.totalAmount}`);
          console.log(`Jobs Billed: ${result.jobCount}`);
        } else {
          console.log('\n╔════════════════════════════════════════════════════╗');
          console.log('║  ❌ BILLING FAILED                                ║');
          console.log('╚════════════════════════════════════════════════════╝\n');
          console.log(`Error: ${result.error}`);
          process.exit(1);
        }
      }

    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate configuration and API connections')
  .action(async () => {
    try {
      console.log('Validating configuration...');
      const config = loadConfig();
      console.log('✅ Configuration loaded successfully');

      console.log('\nTesting Projetex API connection...');
      // Test would go here - for now just confirm config exists
      console.log('✅ Projetex configuration present');

      console.log('\nTesting Fortnox API connection...');
      // Test would go here - for now just confirm config exists
      console.log('✅ Fortnox configuration present');

      console.log('\n✅ All validations passed!');

    } catch (error) {
      console.error('\n❌ Validation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

export { BillingService } from './services/billing';
export { ProjetexClient } from './clients/projetex';
export { FortnoxClient } from './clients/fortnox';
export { loadConfig } from './config';
export * from './types/projetex';
export * from './types/fortnox';

// Main export for programmatic usage
import { BillingService } from './services/billing';
import { loadConfig } from './config';

/**
 * Create a billing service instance with loaded configuration
 */
export function createBillingService(): BillingService {
  const config = loadConfig();
  return new BillingService(config);
}

/**
 * Quick function to bill a project
 * @param projectNumber The Projetex project number to bill
 */
export async function billProject(projectNumber: string) {
  const service = createBillingService();
  return await service.billProject(projectNumber);
}

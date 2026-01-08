import axios, { AxiosInstance } from 'axios';
import {
  FortnoxCustomer,
  FortnoxInvoice,
  FortnoxInvoiceResponse,
  FortnoxCustomerResponse,
  FortnoxError
} from '../types/fortnox';
import { Config } from '../config';

export class FortnoxClient {
  private client: AxiosInstance;
  private config: Config['fortnox'];

  constructor(config: Config['fortnox']) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': config.accessToken,
        'Client-Secret': config.clientSecret,
      },
      timeout: 30000,
    });
  }

  /**
   * Get customer by customer number
   * @param customerNumber The Fortnox customer number
   * @returns Customer details
   */
  async getCustomer(customerNumber: string): Promise<FortnoxCustomer> {
    try {
      const response = await this.client.get<FortnoxCustomerResponse>(
        `/customers/${customerNumber}`
      );
      return response.data.Customer;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const fortnoxError = error.response?.data as FortnoxError;
        throw new Error(
          `Fortnox API error: ${fortnoxError?.ErrorInformation?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Search for customer by name or organization number
   * @param searchTerm Search term (name or org number)
   * @returns List of matching customers
   */
  async searchCustomers(searchTerm: string): Promise<FortnoxCustomer[]> {
    try {
      const response = await this.client.get('/customers', {
        params: {
          filter: searchTerm,
        }
      });
      return response.data.Customers || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const fortnoxError = error.response?.data as FortnoxError;
        throw new Error(
          `Fortnox API error: ${fortnoxError?.ErrorInformation?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Create a new invoice in Fortnox
   * @param invoice Invoice data
   * @returns Created invoice response
   */
  async createInvoice(invoice: FortnoxInvoice): Promise<FortnoxInvoiceResponse> {
    try {
      const response = await this.client.post<FortnoxInvoiceResponse>(
        '/invoices',
        { Invoice: invoice }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const fortnoxError = error.response?.data as FortnoxError;
        const errorMessage = fortnoxError?.ErrorInformation?.message || error.message;
        throw new Error(`Failed to create invoice in Fortnox: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Validate that customer exists in Fortnox
   * @param customerNumber The customer number to validate
   * @returns true if customer exists, throws error otherwise
   */
  async validateCustomer(customerNumber: string): Promise<boolean> {
    try {
      await this.getCustomer(customerNumber);
      return true;
    } catch (error) {
      throw new Error(`Customer ${customerNumber} not found in Fortnox: ${error}`);
    }
  }

  /**
   * Get or create customer by matching client code from Projetex
   * This is a helper method to map Projetex clients to Fortnox customers
   * @param clientCode Client code from Projetex
   * @param clientName Client name from Projetex
   * @returns Fortnox customer number
   */
  async findCustomerByClientCode(clientCode: string, clientName: string): Promise<string> {
    try {
      // First try to use the client code as customer number directly
      const customer = await this.getCustomer(clientCode);
      return customer.CustomerNumber;
    } catch (error) {
      // If not found, search by name
      const customers = await this.searchCustomers(clientName);

      if (customers.length === 0) {
        throw new Error(
          `No customer found in Fortnox matching client code "${clientCode}" or name "${clientName}". ` +
          'Please create the customer in Fortnox first or ensure the client code matches the customer number.'
        );
      }

      if (customers.length > 1) {
        throw new Error(
          `Multiple customers found in Fortnox matching "${clientName}". ` +
          'Please specify the exact customer number to use.'
        );
      }

      return customers[0].CustomerNumber;
    }
  }
}

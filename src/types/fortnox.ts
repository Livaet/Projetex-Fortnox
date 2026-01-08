export interface FortnoxCustomer {
  CustomerNumber: string;
  Name: string;
  OrganisationNumber?: string;
  Email?: string;
  Phone?: string;
  Address1?: string;
  Address2?: string;
  ZipCode?: string;
  City?: string;
  Country?: string;
}

export interface FortnoxInvoiceRow {
  ArticleNumber?: string;
  Description: string;
  Quantity: number;
  Unit?: string;
  Price: number;
  VAT?: number;
  Discount?: number;
  AccountNumber?: number;
}

export interface FortnoxInvoice {
  CustomerNumber: string;
  InvoiceDate: string;
  DueDate?: string;
  Currency: string;
  InvoiceRows: FortnoxInvoiceRow[];
  Remarks?: string;
  OurReference?: string;
  YourReference?: string;
}

export interface FortnoxInvoiceResponse {
  Invoice: {
    '@url': string;
    DocumentNumber: string;
    InvoiceNumber: number;
    CustomerNumber: string;
    Total: number;
    Balance: number;
  };
}

export interface FortnoxCustomerResponse {
  Customer: FortnoxCustomer;
}

export interface FortnoxError {
  ErrorInformation: {
    error: number;
    message: string;
    code: number;
  };
}

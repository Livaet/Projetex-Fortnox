# Projetex-Fortnox Billing Connector

A TypeScript-based connector that automates billing of Projetex translation projects in Fortnox accounting system.

## Features

- ✅ Fetch project and job details from Projetex API
- ✅ Automatically match Projetex clients with Fortnox customers
- ✅ Create consolidated invoices in Fortnox for all jobs in a project
- ✅ Support for multiple jobs per invoice
- ✅ Preview billing before creating invoices
- ✅ Comprehensive error handling and validation
- ✅ CLI interface for easy usage

## Prerequisites

- Node.js 18+ and npm
- Projetex account with API access
- Fortnox account with API credentials
- API keys and access tokens for both systems

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Projetex-Fortnox
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file with your credentials:
```env
# Projetex API Configuration
PROJETEX_API_URL=https://your-company.projetex.com/api
PROJETEX_API_KEY=your-projetex-api-key
PROJETEX_USERNAME=your-username

# Fortnox API Configuration
FORTNOX_API_URL=https://api.fortnox.se/3
FORTNOX_ACCESS_TOKEN=your-fortnox-access-token
FORTNOX_CLIENT_SECRET=your-fortnox-client-secret
```

5. Build the project:
```bash
npm run build
```

## Usage

### Command Line Interface

#### Bill a Project

Create an invoice in Fortnox for a Projetex project:

```bash
npm run bill <project-number>
```

Example:
```bash
npm run bill PRJ-2024-001
```

#### Preview Billing

Preview what will be billed without creating an invoice:

```bash
npm run bill -- <project-number> --preview
```

Example:
```bash
npm run bill -- PRJ-2024-001 --preview
```

#### Validate Configuration

Test your API credentials and configuration:

```bash
npm run bill validate
```

### Programmatic Usage

You can also use the connector as a library in your own TypeScript/JavaScript code:

```typescript
import { createBillingService, billProject } from 'projetex-fortnox-connector';

// Quick usage
const result = await billProject('PRJ-2024-001');
console.log('Invoice number:', result.invoiceNumber);

// Advanced usage
const billingService = createBillingService();
const preview = await billingService.previewBilling('PRJ-2024-001');
console.log('Total amount:', preview.totalAmount);

const result = await billingService.billProject('PRJ-2024-001');
```

## How It Works

1. **Fetch Project**: The connector retrieves project details from Projetex using the project number
2. **Extract Jobs**: All completed jobs in the project are identified for billing
3. **Match Customer**: The client from Projetex is matched with a customer in Fortnox (by customer number or name)
4. **Create Invoice**: A single invoice is created in Fortnox with all billable jobs as line items
5. **Confirmation**: The invoice number and total are returned

## Data Mapping

### Projetex → Fortnox

| Projetex Field | Fortnox Field | Notes |
|----------------|---------------|-------|
| Client Code | Customer Number | Used for matching |
| Client Name | Customer Name | Fallback for matching |
| Job Number | Invoice Row Description | Included in description |
| Job Name | Invoice Row Description | Main description |
| Quantity | Invoice Row Quantity | Numeric value |
| Unit | Invoice Row Unit | e.g., "words", "pages" |
| Price Per Unit | Invoice Row Price | Unit price |
| Project Number | Invoice Reference | OurReference field |

## Configuration

### API Endpoints

#### Projetex API

The connector expects these Projetex API endpoints:
- `GET /projects/{projectNumber}` - Get project details
- `GET /projects/{projectId}/jobs` - Get project jobs

#### Fortnox API

The connector uses these Fortnox API endpoints:
- `GET /customers/{customerNumber}` - Get customer details
- `GET /customers?filter={search}` - Search customers
- `POST /invoices` - Create invoice

### Client Matching

The connector matches Projetex clients to Fortnox customers using this strategy:

1. **Direct Match**: Try using Projetex client code as Fortnox customer number
2. **Name Search**: If direct match fails, search Fortnox customers by client name
3. **Error**: If no match or multiple matches found, raise an error

To ensure successful matching:
- Use Fortnox customer numbers as Projetex client codes, OR
- Ensure client names in Projetex match customer names in Fortnox exactly

## Error Handling

The connector handles various error scenarios:

- **Missing Configuration**: Clear error messages for missing environment variables
- **Project Not Found**: Validation that project exists in Projetex
- **No Billable Jobs**: Check for completed jobs with amounts > 0
- **Customer Not Found**: Validation that customer exists in Fortnox
- **API Errors**: Detailed error messages from both APIs
- **Network Issues**: Timeout and retry handling

## Development

### Project Structure

```
Projetex-Fortnox/
├── src/
│   ├── clients/          # API client implementations
│   │   ├── projetex.ts   # Projetex API client
│   │   └── fortnox.ts    # Fortnox API client
│   ├── services/         # Business logic
│   │   └── billing.ts    # Main billing service
│   ├── types/            # TypeScript type definitions
│   │   ├── projetex.ts   # Projetex types
│   │   └── fortnox.ts    # Fortnox types
│   ├── config/           # Configuration management
│   │   └── index.ts      # Config loader
│   ├── cli.ts            # CLI interface
│   └── index.ts          # Main entry point
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode
- `npm run bill` - Run the CLI billing command
- `npm start` - Run the compiled code

### Testing

To test the connector with a real project:

1. Start with preview mode to validate data:
```bash
npm run bill -- <project-number> --preview
```

2. Verify the output shows correct project, customer, and job details

3. If everything looks correct, run without preview to create invoice:
```bash
npm run bill <project-number>
```

## API Documentation

### Projetex API

For detailed Projetex API documentation, refer to:
- Projetex API documentation at your instance: `https://your-company.projetex.com/api/docs`
- Contact Projetex support for API credentials

### Fortnox API

For Fortnox API documentation:
- Official documentation: https://developer.fortnox.se/
- Authentication guide: https://developer.fortnox.se/general/authentication/
- API reference: https://developer.fortnox.se/documentation/

## Troubleshooting

### "Customer not found in Fortnox"

**Solution**: Ensure the Projetex client code matches a Fortnox customer number, or that the client name exactly matches a customer name in Fortnox.

### "No billable jobs"

**Solution**: Check that the project has jobs with status "completed" and amount > 0. Only completed jobs are included in billing.

### "Missing required environment variables"

**Solution**: Ensure all required variables in `.env` are set. Copy from `.env.example` if needed.

### API Authentication Errors

**Solution**:
- Verify your API credentials are correct and active
- Check that your API access tokens haven't expired
- Ensure your API user has the necessary permissions in both systems

## Security Notes

- Never commit the `.env` file to version control
- Store API credentials securely
- Use environment-specific configurations for production
- Regularly rotate API keys and access tokens
- Audit API access logs regularly

## License

MIT

## Support

For issues, questions, or contributions, please open an issue in the repository.

## Changelog

### Version 1.0.0 (2024-01-08)
- Initial release
- Projetex API client
- Fortnox API client
- Billing service with job consolidation
- CLI interface
- Preview mode
- Configuration validation

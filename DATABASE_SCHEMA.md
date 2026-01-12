# Projetex 3D Database Schema Configuration

This document describes the database tables and columns used by the connector. If your Projetex 3D installation uses different table or column names, you'll need to modify the SQL queries in `src/clients/projetex.ts`.

## Current Configuration

### Projects Table

**Table Name:** `Projects`

**Columns Used:**
- `idProject` (INT) - Primary key
- `ProjectNo` (VARCHAR) - Project number (used for lookup)
- `ProjectName` (VARCHAR) - Project name
- `idClient` (INT) - Foreign key to Clients table
- `Status` (VARCHAR) - Project status

### Clients Table

**Table Name:** `Clients`

**Columns Used:**
- `idClient` (INT) - Primary key
- `ClientName` (VARCHAR) - Client name
- `ClientCode` (VARCHAR) - Client code (mapped to Fortnox customer number)

### Jobs/Tasks Table

**Table Name:** `Jobs`

**Columns Used:**
- `idJob` (INT) - Primary key
- `idProject` (INT) - Foreign key to Projects table
- `JobNo` (VARCHAR) - Job number
- `JobName` (VARCHAR) - Job name/title
- `Description` (VARCHAR/TEXT) - Job description
- `SourceLanguage` (VARCHAR) - Source language
- `TargetLanguage` (VARCHAR) - Target language
- `Quantity` (DECIMAL/FLOAT) - Quantity/volume
- `Unit` (VARCHAR) - Unit of measurement (words, pages, etc.)
- `PricePerUnit` (DECIMAL/FLOAT) - Price per unit
- `TotalAmount` (DECIMAL/FLOAT) - Total amount for the job
- `Status` (VARCHAR) - Job status (completed, in progress, etc.)
- `CompletedDate` (DATETIME) - Date when job was completed

## How to Customize

If your Projetex 3D database uses different names:

### 1. Open the Projetex Client

Edit `src/clients/projetex.ts`

### 2. Modify the Project Query

Find the `projectQuery` in the `getProject()` method (around line 60):

```sql
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
```

**Adjust:**
- Table names (`Projects`, `Clients`)
- Column names (everything before `as`)
- Join conditions

### 3. Modify the Jobs Query

Find the `jobsQuery` in the `getProjectJobs()` method (around line 116):

```sql
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
```

**Adjust:**
- Table name (`Jobs`)
- Column names (everything before `as`)

### 4. Rebuild

After making changes:

```bash
npm run build
npm run build:win  # or build:linux, build:macos
```

## Testing Your Queries

You can test queries directly in your SQL client before modifying the code:

### Test Project Query

```sql
-- Replace '12345' with an actual project number
SELECT
  p.idProject, p.ProjectNo, p.ProjectName, p.idClient, p.Status,
  c.ClientName, c.ClientCode
FROM Projects p
LEFT JOIN Clients c ON p.idClient = c.idClient
WHERE p.ProjectNo = '12345'
```

### Test Jobs Query

```sql
-- Replace 123 with an actual project ID
SELECT
  j.idJob, j.JobNo, j.JobName, j.Description,
  j.SourceLanguage, j.TargetLanguage,
  j.Quantity, j.Unit, j.PricePerUnit, j.TotalAmount,
  j.Status, j.CompletedDate
FROM Jobs j
WHERE j.idProject = 123
```

## Common Variations

Different Projetex installations might use:

### Alternative Table Names
- `tblProjects` instead of `Projects`
- `tblClients` instead of `Clients`
- `tblJobs` or `Tasks` instead of `Jobs`

### Alternative Column Names
- `Project_No` instead of `ProjectNo`
- `Client_ID` instead of `idClient`
- `Job_Number` instead of `JobNo`
- `Price` instead of `PricePerUnit`
- `Total` instead of `TotalAmount`

### Alternative Status Values
- `Completed` vs `Done` vs `Finished`
- `Active` vs `In Progress` vs `Ongoing`

The connector already handles multiple status values for completed jobs:
- "completed"
- "done"
- "finished"

## Getting Your Schema

To find your actual table and column names, run this in your SQL client:

```sql
-- List all tables in the database
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Get columns for Projects table (adjust table name)
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Projects'
ORDER BY ORDINAL_POSITION;

-- Get columns for Jobs table (adjust table name)
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

-- Get columns for Clients table (adjust table name)
SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Clients'
ORDER BY ORDINAL_POSITION;
```

## Need Help?

If you're unsure about your schema:

1. Connect to your Projetex 3D database with a SQL client
2. Run the schema discovery queries above
3. Share the output and we can help adjust the queries

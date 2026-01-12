import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  projetex: {
    server: string;
    port: number;
    database: string;
    user: string;
    password: string;
    trustServerCertificate: boolean;
  };
  fortnox: {
    apiUrl: string;
    accessToken: string;
    clientSecret: string;
  };
}

export function loadConfig(): Config {
  const requiredEnvVars = [
    'PROJETEX_DB_SERVER',
    'PROJETEX_DB_PORT',
    'PROJETEX_DB_DATABASE',
    'PROJETEX_DB_USER',
    'PROJETEX_DB_PASSWORD',
    'FORTNOX_API_URL',
    'FORTNOX_ACCESS_TOKEN',
    'FORTNOX_CLIENT_SECRET'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    projetex: {
      server: process.env.PROJETEX_DB_SERVER!,
      port: parseInt(process.env.PROJETEX_DB_PORT!, 10),
      database: process.env.PROJETEX_DB_DATABASE!,
      user: process.env.PROJETEX_DB_USER!,
      password: process.env.PROJETEX_DB_PASSWORD!,
      trustServerCertificate: process.env.PROJETEX_DB_TRUST_CERT === 'true' || true,
    },
    fortnox: {
      apiUrl: process.env.FORTNOX_API_URL!,
      accessToken: process.env.FORTNOX_ACCESS_TOKEN!,
      clientSecret: process.env.FORTNOX_CLIENT_SECRET!,
    }
  };
}

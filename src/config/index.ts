import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  projetex: {
    apiUrl: string;
    apiKey: string;
    username: string;
  };
  fortnox: {
    apiUrl: string;
    accessToken: string;
    clientSecret: string;
  };
}

export function loadConfig(): Config {
  const requiredEnvVars = [
    'PROJETEX_API_URL',
    'PROJETEX_API_KEY',
    'PROJETEX_USERNAME',
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
      apiUrl: process.env.PROJETEX_API_URL!,
      apiKey: process.env.PROJETEX_API_KEY!,
      username: process.env.PROJETEX_USERNAME!,
    },
    fortnox: {
      apiUrl: process.env.FORTNOX_API_URL!,
      accessToken: process.env.FORTNOX_ACCESS_TOKEN!,
      clientSecret: process.env.FORTNOX_CLIENT_SECRET!,
    }
  };
}

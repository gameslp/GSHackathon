import { client } from './generated/client.gen';

// Configure the API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

client.setConfig({
  baseUrl: API_BASE_URL,
  credentials: 'include', // Important: include cookies for JWT
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export the configured client
export { client };

// Export all generated types and functions
export * from './generated/types.gen';
export * from './generated/sdk.gen';

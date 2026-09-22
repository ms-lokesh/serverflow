import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/serveflow',
    maxPool: parseInt(process.env.DB_MAX_POOL || '20', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'serveflow_access_super_secret_jwt_key_2026_987654321',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'serveflow_refresh_super_secret_jwt_key_2026_123456789',
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
  defaultRestaurantId: 'rest_spice_house_01',
};

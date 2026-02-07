// Re-export canonical types from database.ts
// The User type with law_firm_id, user_type, etc. is in database.ts
export type { User, UserInsert, UserUpdate } from './database'

export interface Api_Response<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface Logger_Level {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

export type Environment = 'development' | 'production' | 'test';

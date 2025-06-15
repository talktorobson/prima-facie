export interface User {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

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
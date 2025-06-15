import { Api_Response, User } from '../types';
import { Logger } from '../utils/logger';

class Example_Service {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  async get_example_data(): Promise<Api_Response<string>> {
    try {
      this.logger.info('Fetching example data');
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        data: 'Hello from Prima Facie service!',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get example data:', error);
      return {
        success: false,
        error: 'Failed to fetch example data',
        timestamp: new Date(),
      };
    }
  }

  async create_example_user(name: string, email: string): Promise<Api_Response<User>> {
    try {
      this.logger.info('Creating example user:', { name, email });
      
      const user: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        created_at: new Date(),
        updated_at: new Date(),
      };

      return {
        success: true,
        data: user,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      return {
        success: false,
        error: 'Failed to create user',
        timestamp: new Date(),
      };
    }
  }
}

export const example_service = new Example_Service();
import { example_service } from '../src/services/example_service';
import { Logger } from '../src/utils/logger';
import { is_valid_email, capitalize_first_letter } from '../src/utils';

describe('Example Service', () => {
  test('should get example data successfully', async () => {
    const result = await example_service.get_example_data();
    
    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello from Prima Facie service!');
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  test('should create example user successfully', async () => {
    const result = await example_service.create_example_user('John Doe', 'john@example.com');
    
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('John Doe');
    expect(result.data?.email).toBe('john@example.com');
    expect(result.data?.id).toMatch(/^user_\d+$/);
  });
});

describe('Utils', () => {
  test('should validate email correctly', () => {
    expect(is_valid_email('test@example.com')).toBe(true);
    expect(is_valid_email('invalid-email')).toBe(false);
    expect(is_valid_email('test@')).toBe(false);
  });

  test('should capitalize first letter', () => {
    expect(capitalize_first_letter('hello')).toBe('Hello');
    expect(capitalize_first_letter('WORLD')).toBe('World');
    expect(capitalize_first_letter('tEST')).toBe('Test');
  });
});

describe('Logger', () => {
  test('should create logger instance', () => {
    const logger = new Logger();
    expect(logger).toBeInstanceOf(Logger);
  });
});
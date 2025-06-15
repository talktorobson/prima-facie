import { example_service } from './services/example_service';
import { Logger } from './utils/logger';

const logger = new Logger();

async function main(): Promise<void> {
  try {
    logger.info('Starting prima-facie application');
    
    const result = await example_service.get_example_data();
    logger.info('Example result:', result);
    
    logger.info('Prima-facie application completed successfully');
  } catch (error) {
    logger.error('Application error:', error);
    process.exit(1);
  }
}

main();
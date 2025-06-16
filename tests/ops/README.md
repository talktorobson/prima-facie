# Prima Facie Operational Test Suite

This directory contains comprehensive operational tests for the Prima Facie legal practice management system. These tests validate the system's operational readiness across multiple dimensions including environment validation, database connectivity, performance, security, and deployment readiness.

## Test Structure

The operational test suite is organized into the following test categories:

### 1. Environment Validation (`environment-validation.test.js`)
- Node.js and NPM version compatibility
- Package.json validation and critical dependencies
- Node modules installation verification
- Environment variables configuration
- TypeScript and Next.js configuration validation
- Build tool availability

### 2. Supabase Connectivity (`supabase-connectivity.test.js`)
- Supabase environment variables validation
- API endpoint connectivity testing
- Client initialization verification
- Database connection testing
- Authentication service validation
- Real-time connection testing
- Row Level Security (RLS) validation
- Database schema verification

### 3. Database Performance (`database-performance.test.js`)
- Connection pool performance testing
- Query response time benchmarking
- Concurrent query load testing
- Memory usage monitoring during database operations
- Connection timeout testing
- Database connection stability over time

### 4. Filesystem Permissions (`filesystem-permissions.test.js`)
- Project directory structure validation
- File read/write permissions testing
- Temporary directory access verification
- Log directory permissions validation
- File size and disk space monitoring

### 5. Logging and Monitoring (`logging-monitoring.test.js`)
- Console logging functionality testing
- Log file creation and rotation testing
- Error tracking and reporting validation
- Performance monitoring setup verification
- Application health metrics collection
- Log analysis and alerting capabilities

### 6. Backup and Recovery (`backup-recovery.test.js`)
- Database backup configuration testing
- File system backup procedures validation
- Database schema backup verification
- Recovery procedure testing
- Backup retention and cleanup validation

### 7. Security Configuration (`security-configuration.test.js`)
- HTTPS configuration validation
- CORS policy testing
- Authentication security verification
- Rate limiting functionality testing
- Environment security validation

### 8. Performance Benchmarks (`performance-benchmarks.test.js`)
- Database query performance benchmarking
- Memory usage benchmarking
- CPU performance testing
- Network latency and throughput testing

### 9. Health Checks (`health-checks.test.js`)
- Basic application health monitoring
- Database health verification
- External services connectivity testing
- Resource utilization monitoring

### 10. Deployment Readiness (`deployment-readiness.test.js`)
- Build process validation
- Production environment configuration
- Database migration readiness
- Deployment platform compatibility
- Final deployment checklist verification

## Running the Tests

### Prerequisites

1. **Environment Setup**: Ensure you have the following environment variables configured:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anonymous_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NODE_ENV=development|production|test
   ```

2. **Dependencies**: Make sure all project dependencies are installed:
   ```bash
   npm install
   ```

3. **Database Access**: Ensure your Supabase database is accessible and properly configured.

### Running All Tests

To run the complete operational test suite:

```bash
# From the project root directory
node tests/ops/ops-test-runner.js
```

### Running Individual Test Suites

You can also run individual test categories by importing and executing them directly:

```bash
# Example: Run only environment validation tests
node -e "
const { tests } = require('./tests/ops/environment-validation.test.js');
tests.forEach(async (test) => {
  console.log('Running:', test.name);
  const result = await test.function();
  console.log('Result:', result);
});
"
```

### Test Output

The test runner generates multiple types of output:

1. **Console Output**: Real-time test results with color-coded status indicators
2. **JSON Report**: Detailed test results saved to `ops-test-report.json`
3. **HTML Report**: Human-readable test report saved to `ops-test-report.html`

### Test Status Codes

Tests can return one of the following statuses:
- **PASSED**: Test completed successfully with no issues
- **WARNING**: Test completed but with minor issues or recommendations
- **FAILED**: Test failed due to critical issues that need attention

### Exit Codes

The test runner uses the following exit codes:
- `0`: All tests passed
- `1`: One or more tests failed
- `2`: All tests passed but with warnings

## Test Configuration

### Environment-Specific Testing

The tests automatically adapt to different environments:

- **Development**: More lenient checks, focuses on development setup
- **Production**: Strict security and performance requirements
- **Test**: Optimized for CI/CD pipeline execution

### Customizing Tests

You can customize test behavior by modifying the test files or creating environment-specific configurations:

1. **Timeout Values**: Adjust timeout values for network operations
2. **Performance Thresholds**: Modify performance benchmarks based on your requirements
3. **Security Policies**: Update security validation rules for your deployment environment

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   ```
   Solution: Ensure all required environment variables are set in your .env.local file
   ```

2. **Database Connection Failures**
   ```
   Solution: Verify Supabase URL and keys are correct and the database is accessible
   ```

3. **Permission Errors**
   ```
   Solution: Check file system permissions for the project directory and subdirectories
   ```

4. **Performance Test Failures**
   ```
   Solution: Consider your network conditions and adjust performance thresholds if needed
   ```

### Debug Mode

For detailed debugging information, you can run tests with additional logging:

```bash
DEBUG=true node tests/ops/ops-test-runner.js
```

### Memory Optimization

If you encounter memory issues during testing, you can run with increased memory:

```bash
node --max-old-space-size=4096 tests/ops/ops-test-runner.js
```

### Garbage Collection

For more accurate memory testing, enable garbage collection:

```bash
node --expose-gc tests/ops/ops-test-runner.js
```

## Integration with CI/CD

The operational test suite is designed to integrate seamlessly with CI/CD pipelines:

### GitHub Actions Example

```yaml
name: Operational Tests
on: [push, pull_request]

jobs:
  ops-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node tests/ops/ops-test-runner.js
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          NODE_ENV: test
```

### Docker Integration

```dockerfile
# Add to your Dockerfile for container testing
COPY tests/ /app/tests/
RUN node tests/ops/ops-test-runner.js
```

## Monitoring and Alerting

The operational tests can be integrated with monitoring systems:

1. **Test Result Metrics**: Export test results to monitoring dashboards
2. **Alert Triggers**: Set up alerts for test failures in production
3. **Performance Tracking**: Track performance metrics over time
4. **Health Monitoring**: Use health check tests for continuous monitoring

## Contributing

When adding new operational tests:

1. **Follow Naming Convention**: Use descriptive test names and consistent file naming
2. **Include Documentation**: Document test purpose and expected outcomes
3. **Error Handling**: Implement proper error handling and cleanup
4. **Performance Considerations**: Ensure tests don't impact system performance significantly
5. **Environment Compatibility**: Test across different environments

## Security Considerations

- **Sensitive Data**: Never log sensitive information like API keys or passwords
- **Test Data**: Use test-specific data that doesn't affect production systems
- **Access Controls**: Ensure tests respect existing security policies
- **Cleanup**: Always clean up test artifacts and temporary files

## Support

For issues with the operational test suite:

1. Check the troubleshooting section above
2. Review test logs and error messages
3. Verify environment configuration
4. Consult the project documentation
5. Open an issue with detailed error information

---

**Note**: These operational tests are designed to be comprehensive but should be customized based on your specific deployment requirements and constraints.
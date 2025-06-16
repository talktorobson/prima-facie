/**
 * Filesystem Permissions Tests
 * Tests file system access, permissions, and directory structure
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const tests = [
  {
    name: 'Project Directory Structure',
    function: async () => {
      const requiredDirs = [
        'app',
        'components',
        'lib',
        'public',
        'styles',
        'types'
      ];
      
      const optionalDirs = [
        'tests',
        'coverage',
        'database',
        'docs'
      ];
      
      const projectRoot = process.cwd();
      const results = {
        projectRoot,
        requiredDirs: [],
        optionalDirs: [],
        missingRequired: [],
        missingOptional: []
      };
      
      // Check required directories
      for (const dir of requiredDirs) {
        const dirPath = path.join(projectRoot, dir);
        const exists = fs.existsSync(dirPath);
        const stats = exists ? fs.statSync(dirPath) : null;
        
        const dirInfo = {
          name: dir,
          path: dirPath,
          exists,
          isDirectory: stats ? stats.isDirectory() : false,
          permissions: stats ? stats.mode.toString(8) : null,
          size: stats ? stats.size : null,
          lastModified: stats ? stats.mtime : null
        };
        
        results.requiredDirs.push(dirInfo);
        
        if (!exists || !stats.isDirectory()) {
          results.missingRequired.push(dir);
        }
      }
      
      // Check optional directories
      for (const dir of optionalDirs) {
        const dirPath = path.join(projectRoot, dir);
        const exists = fs.existsSync(dirPath);
        const stats = exists ? fs.statSync(dirPath) : null;
        
        const dirInfo = {
          name: dir,
          path: dirPath,
          exists,
          isDirectory: stats ? stats.isDirectory() : false,
          permissions: stats ? stats.mode.toString(8) : null
        };
        
        results.optionalDirs.push(dirInfo);
        
        if (!exists || !stats.isDirectory()) {
          results.missingOptional.push(dir);
        }
      }
      
      if (results.missingRequired.length > 0) {
        return {
          status: 'failed',
          message: `Missing required directories: ${results.missingRequired.join(', ')}`,
          details: results
        };
      }
      
      if (results.missingOptional.length > 0) {
        return {
          status: 'warning',
          message: `Missing optional directories: ${results.missingOptional.join(', ')}`,
          details: results
        };
      }
      
      return {
        status: 'passed',
        message: 'All required directories are present',
        details: results
      };
    }
  },

  {
    name: 'File Read Permissions',
    function: async () => {
      const criticalFiles = [
        'package.json',
        'next.config.js',
        'tsconfig.json',
        'tailwind.config.ts'
      ];
      
      const results = {
        testedFiles: [],
        readableFiles: [],
        unreadableFiles: [],
        missingFiles: []
      };
      
      for (const file of criticalFiles) {
        const filePath = path.join(process.cwd(), file);
        
        try {
          if (!fs.existsSync(filePath)) {
            results.missingFiles.push(file);
            continue;
          }
          
          const stats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf8');
          
          const fileInfo = {
            name: file,
            path: filePath,
            readable: true,
            size: stats.size,
            permissions: stats.mode.toString(8),
            contentLength: content.length
          };
          
          results.testedFiles.push(fileInfo);
          results.readableFiles.push(fileInfo);
        } catch (error) {
          const fileInfo = {
            name: file,
            path: filePath,
            readable: false,
            error: error.message
          };
          
          results.testedFiles.push(fileInfo);
          results.unreadableFiles.push(fileInfo);
        }
      }
      
      if (results.unreadableFiles.length > 0) {
        return {
          status: 'failed',
          message: `Cannot read critical files: ${results.unreadableFiles.map(f => f.name).join(', ')}`,
          details: results
        };
      }
      
      if (results.missingFiles.length > 0) {
        return {
          status: 'warning',
          message: `Missing configuration files: ${results.missingFiles.join(', ')}`,
          details: results
        };
      }
      
      return {
        status: 'passed',
        message: `All critical files are readable (${results.readableFiles.length} files)`,
        details: results
      };
    }
  },

  {
    name: 'File Write Permissions',
    function: async () => {
      const testDirs = [
        'public',
        'coverage',
        path.join('tests', 'ops')
      ];
      
      const results = {
        testedDirs: [],
        writableDirs: [],
        nonWritableDirs: [],
        testFiles: []
      };
      
      for (const dir of testDirs) {
        const dirPath = path.join(process.cwd(), dir);
        
        try {
          // Ensure directory exists
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          const testFileName = `test-write-${Date.now()}.tmp`;
          const testFilePath = path.join(dirPath, testFileName);
          
          // Test write permission
          fs.writeFileSync(testFilePath, 'test content');
          
          // Test read back
          const content = fs.readFileSync(testFilePath, 'utf8');
          
          // Clean up test file
          fs.unlinkSync(testFilePath);
          
          const dirInfo = {
            name: dir,
            path: dirPath,
            writable: true,
            testFile: testFileName,
            contentMatches: content === 'test content'
          };
          
          results.testedDirs.push(dirInfo);
          results.writableDirs.push(dirInfo);
          results.testFiles.push(testFilePath);
        } catch (error) {
          const dirInfo = {
            name: dir,
            path: dirPath,
            writable: false,
            error: error.message
          };
          
          results.testedDirs.push(dirInfo);
          results.nonWritableDirs.push(dirInfo);
        }
      }
      
      if (results.nonWritableDirs.length > 0) {
        return {
          status: 'failed',
          message: `Cannot write to directories: ${results.nonWritableDirs.map(d => d.name).join(', ')}`,
          details: results
        };
      }
      
      return {
        status: 'passed',
        message: `All test directories are writable (${results.writableDirs.length} directories)`,
        details: results
      };
    }
  },

  {
    name: 'Temporary Directory Access',
    function: async () => {
      const tempDir = os.tmpdir();
      const testDir = path.join(tempDir, `prima-facie-test-${Date.now()}`);
      
      try {
        // Create test directory
        fs.mkdirSync(testDir, { recursive: true });
        
        const testFile = path.join(testDir, 'test-file.txt');
        const testContent = 'Prima Facie temporary file test';
        
        // Write test file
        fs.writeFileSync(testFile, testContent);
        
        // Read back test file
        const readContent = fs.readFileSync(testFile, 'utf8');
        
        // Get file stats
        const stats = fs.statSync(testFile);
        
        // Clean up
        fs.unlinkSync(testFile);
        fs.rmdirSync(testDir);
        
        return {
          status: 'passed',
          message: 'Temporary directory access is working correctly',
          details: {
            tempDir,
            testDir,
            testFile,
            contentMatches: readContent === testContent,
            fileSize: stats.size,
            permissions: stats.mode.toString(8)
          }
        };
      } catch (error) {
        // Attempt cleanup even on error
        try {
          if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        return {
          status: 'failed',
          message: `Temporary directory access failed: ${error.message}`,
          details: {
            tempDir,
            testDir,
            error: error.message
          }
        };
      }
    }
  },

  {
    name: 'Log Directory Permissions',
    function: async () => {
      const logDirs = [
        'logs',
        path.join('coverage'),
        '.next'
      ];
      
      const results = {
        checkedDirs: [],
        accessibleDirs: [],
        createdDirs: [],
        errors: []
      };
      
      for (const dir of logDirs) {
        const dirPath = path.join(process.cwd(), dir);
        
        try {
          let dirExists = fs.existsSync(dirPath);
          let created = false;
          
          // Create directory if it doesn't exist
          if (!dirExists) {
            fs.mkdirSync(dirPath, { recursive: true });
            created = true;
            dirExists = true;
          }
          
          if (dirExists) {
            const stats = fs.statSync(dirPath);
            
            // Test write permission with a test file
            const testLogFile = path.join(dirPath, `test-log-${Date.now()}.log`);
            fs.writeFileSync(testLogFile, `Test log entry: ${new Date().toISOString()}\n`);
            
            // Clean up test file
            fs.unlinkSync(testLogFile);
            
            const dirInfo = {
              name: dir,
              path: dirPath,
              exists: true,
              created,
              writable: true,
              permissions: stats.mode.toString(8),
              lastModified: stats.mtime
            };
            
            results.checkedDirs.push(dirInfo);
            results.accessibleDirs.push(dirInfo);
            
            if (created) {
              results.createdDirs.push(dirInfo);
            }
          }
        } catch (error) {
          const dirInfo = {
            name: dir,
            path: dirPath,
            exists: fs.existsSync(dirPath),
            writable: false,
            error: error.message
          };
          
          results.checkedDirs.push(dirInfo);
          results.errors.push(dirInfo);
        }
      }
      
      if (results.errors.length > 0) {
        return {
          status: 'warning',
          message: `Some log directories have permission issues: ${results.errors.map(e => e.name).join(', ')}`,
          details: results
        };
      }
      
      return {
        status: 'passed',
        message: `Log directories are accessible (${results.accessibleDirs.length} directories, ${results.createdDirs.length} created)`,
        details: results
      };
    }
  },

  {
    name: 'File Size and Disk Space Check',
    function: async () => {
      try {
        const projectRoot = process.cwd();
        const results = {
          projectRoot,
          diskSpace: {},
          largeFiles: [],
          directoryStats: {}
        };
        
        // Get disk space information
        try {
          const stats = fs.statSync(projectRoot);
          results.diskSpace = {
            available: 'Unable to determine',
            total: 'Unable to determine',
            used: 'Unable to determine'
          };
        } catch (error) {
          results.diskSpace.error = error.message;
        }
        
        // Check for large files in project
        const checkDirectory = (dirPath, relativePath = '') => {
          try {
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
              const fullPath = path.join(dirPath, file);
              const relativeFilePath = path.join(relativePath, file);
              
              try {
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                  // Skip node_modules and .next for performance
                  if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                    checkDirectory(fullPath, relativeFilePath);
                  }
                } else if (stats.size > 10 * 1024 * 1024) { // Files larger than 10MB
                  results.largeFiles.push({
                    file: relativeFilePath,
                    size: stats.size,
                    sizeMB: (stats.size / 1024 / 1024).toFixed(2),
                    lastModified: stats.mtime
                  });
                }
              } catch (statError) {
                // Skip files we can't stat
              }
            }
          } catch (readError) {
            // Skip directories we can't read
          }
        };
        
        checkDirectory(projectRoot);
        
        // Check specific directory sizes
        const importantDirs = ['node_modules', '.next', 'coverage', 'public'];
        
        for (const dir of importantDirs) {
          const dirPath = path.join(projectRoot, dir);
          if (fs.existsSync(dirPath)) {
            try {
              const getDirSize = (dirPath) => {
                let totalSize = 0;
                const files = fs.readdirSync(dirPath);
                
                for (const file of files) {
                  const fullPath = path.join(dirPath, file);
                  try {
                    const stats = fs.statSync(fullPath);
                    if (stats.isDirectory()) {
                      totalSize += getDirSize(fullPath);
                    } else {
                      totalSize += stats.size;
                    }
                  } catch (error) {
                    // Skip files we can't access
                  }
                }
                
                return totalSize;
              };
              
              const size = getDirSize(dirPath);
              results.directoryStats[dir] = {
                size,
                sizeMB: (size / 1024 / 1024).toFixed(2),
                exists: true
              };
            } catch (error) {
              results.directoryStats[dir] = {
                exists: true,
                error: error.message
              };
            }
          } else {
            results.directoryStats[dir] = {
              exists: false
            };
          }
        }
        
        // Check for potential disk space issues
        const totalLargeFileSize = results.largeFiles.reduce((sum, file) => sum + file.size, 0);
        const nodeModulesSize = results.directoryStats['node_modules']?.size || 0;
        
        const warnings = [];
        
        if (results.largeFiles.length > 5) {
          warnings.push(`Many large files detected (${results.largeFiles.length})`);
        }
        
        if (nodeModulesSize > 500 * 1024 * 1024) { // > 500MB
          warnings.push(`Large node_modules directory (${results.directoryStats['node_modules'].sizeMB}MB)`);
        }
        
        if (warnings.length > 0) {
          return {
            status: 'warning',
            message: `Disk space concerns: ${warnings.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `File system usage is reasonable (${results.largeFiles.length} large files)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `File size check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };
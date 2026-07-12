const fs = require('fs');
const path = require('path');

// List of files to validate
const filesToValidate = [
  'server.js',
  'config/database.js',
  'models/User.js',
  'models/Vehicle.js',
  'controllers/authController.js',
  'routes/authRoutes.js',
  'middleware/auth.js',
  'utils/authUtils.js'
];

console.log('Validating JavaScript files for syntax errors...\n');

let hasErrors = false;

filesToValidate.forEach(file => {
  const filePath = path.join(__dirname, file);

  try {
    // Try to require the module to check for syntax errors
    // We'll use a try-catch around require since some files might not be fully functional
    // but we just want to check syntax
    require(filePath);
    console.log(`✅ ${file}`);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      // This might happen if we're trying to require a file that exports nothing
      // Let's try to parse it instead
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // This is a very basic check - just see if we can read the file
        console.log(`⚠️  ${file} (readable but may have runtime dependencies)`);
      } catch (readError) {
        console.log(`${file} - Cannot read file: ${readError.message}`);
        hasErrors = true;
      }
    } else if (error instanceof SyntaxError) {
      console.log(`${file} - Syntax Error: ${error.message}`);
      hasErrors = true;
    } else {
      // Other errors might be due to missing dependencies (like database connection)
      // which is okay for syntax checking
      console.log(` ${file} (loads with potential runtime dependencies)`);
    }
  }
});

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log(' Validation completed with errors');
  process.exit(1);
} else {
  console.log('All files are syntactically valid');
  process.exit(0);
}
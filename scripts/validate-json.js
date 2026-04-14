// Script to validate JSON syntax in translation files
const fs = require('fs');
const path = require('path');

const files = [
  'i18n/locales/zh.json',
  'i18n/locales/en.json'
];

console.log('🔍 Validating JSON files...\n');

let allValid = true;

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log(`✅ ${filePath} - Valid JSON`);
  } catch (error) {
    console.error(`❌ ${filePath} - Invalid JSON:`);
    console.error(`   Error: ${error.message}`);
    allValid = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ All JSON files are valid!');
  process.exit(0);
} else {
  console.log('❌ Some JSON files have syntax errors.');
  process.exit(1);
}
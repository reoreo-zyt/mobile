const fs = require('fs');
const path = require('path');

// 查看包的目录结构
const packagePath = path.join(__dirname, 'node_modules', 'holiday-calendar');
console.log('Package path:', packagePath);

// 查看package.json
let packageJson = null;
const packageJsonPath = path.join(packagePath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('Package.json:', packageJson);
}

// 查看主要文件
const mainFilePath = path.join(packagePath, packageJson?.main || 'index.js');
if (fs.existsSync(mainFilePath)) {
  console.log('Main file content:');
  console.log(fs.readFileSync(mainFilePath, 'utf8'));
}

// 尝试不同的导入方式
try {
  const holidayCalendar = require('holiday-calendar');
  console.log('Import result:', holidayCalendar);
  console.log('Type:', typeof holidayCalendar);
  console.log('Keys:', Object.keys(holidayCalendar));
} catch (e) {
  console.error('Import error:', e);
}
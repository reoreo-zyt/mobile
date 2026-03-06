const XLSX = require('xlsx');

// 读取Excel文件
const workbook = XLSX.readFile('./public/data/311_data.xlsx');

// 打印工作表名称
console.log('Sheet names:', workbook.SheetNames);

// 遍历每个工作表
workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log('\nSheet:', sheetName);
  console.log('Data:', data);
  console.log('Data length:', data.length);
});

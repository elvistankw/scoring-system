#!/usr/bin/env node

/**
 * Translation Check Script
 * 检查组件中的硬编码中文文本，确保所有组件都使用翻译
 */

const fs = require('fs');
const path = require('path');

// 中文字符正则表达式
const chineseRegex = /[\u4e00-\u9fff]/g;

// 需要检查的目录
const componentsDir = path.join(process.cwd(), 'components');
const appDir = path.join(process.cwd(), 'app');

// 排除的文件模式
const excludePatterns = [
  /\.test\./,
  /\.spec\./,
  /node_modules/,
  /\.next/,
  /\.git/
];

// 获取所有 TypeScript React 文件
function getAllTsxFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        // 检查是否应该排除
        const shouldExclude = excludePatterns.some(pattern => pattern.test(fullPath));
        if (!shouldExclude) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 检查文件中的中文文本
function checkFileForChineseText(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    const matches = line.match(chineseRegex);
    if (matches) {
      // 排除注释中的中文
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      // 排除 console.log 中的中文（通常是调试信息）
      if (line.includes('console.')) {
        return;
      }
      
      // 检查是否已经使用了翻译函数
      if (line.includes('t(') || line.includes('dict.')) {
        return;
      }
      
      issues.push({
        line: index + 1,
        content: line.trim(),
        chineseText: matches.join('')
      });
    }
  });
  
  return issues;
}

// 检查文件是否导入了翻译 hook
function checkTranslationImport(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('useTranslation') || content.includes('useDictionary');
}

// 主函数
function main() {
  console.log('🔍 检查组件翻译状态...\n');
  
  const allFiles = [
    ...getAllTsxFiles(componentsDir),
    ...getAllTsxFiles(appDir)
  ];
  
  let totalIssues = 0;
  const fileResults = [];
  
  for (const filePath of allFiles) {
    const issues = checkFileForChineseText(filePath);
    const hasTranslationImport = checkTranslationImport(filePath);
    
    if (issues.length > 0) {
      totalIssues += issues.length;
      fileResults.push({
        filePath: path.relative(process.cwd(), filePath),
        issues,
        hasTranslationImport
      });
    }
  }
  
  // 输出结果
  if (totalIssues === 0) {
    console.log('✅ 所有组件都已正确使用翻译！');
  } else {
    console.log(`❌ 发现 ${totalIssues} 个翻译问题：\n`);
    
    fileResults.forEach(({ filePath, issues, hasTranslationImport }) => {
      console.log(`📄 ${filePath}`);
      
      if (!hasTranslationImport) {
        console.log('   ⚠️  缺少翻译 hook 导入');
      }
      
      issues.forEach(({ line, content, chineseText }) => {
        console.log(`   第 ${line} 行: ${chineseText}`);
        console.log(`   内容: ${content}`);
      });
      
      console.log('');
    });
    
    console.log('\n📋 修复建议：');
    console.log('1. 在组件顶部导入: import { useTranslation } from "@/i18n/use-dictionary";');
    console.log('2. 在组件中使用: const { t } = useTranslation();');
    console.log('3. 将硬编码文本替换为: t("translation.key")');
    console.log('4. 在 i18n/locales/ 中添加对应的翻译键值');
  }
  
  process.exit(totalIssues > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { checkFileForChineseText, checkTranslationImport };
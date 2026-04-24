// @ts-nocheck
/**
 * 🔍 评分系统性能问题自动检测工具
 * Auto-detect Performance Issues in Scoring System
 * 
 * 检测 7 大常见问题：
 * 1. JS 阻塞（大量同步计算）
 * 2. 事件重复绑定
 * 3. 无限请求/API 炸掉
 * 4. DOM 过大
 * 5. 图片/资源过大
 * 6. 内存泄漏
 * 7. 状态管理混乱
 * 
 * 使用方法:
 * node detect-performance-issues.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const issues = [];
const warnings = [];
const suggestions = [];

// 递归读取文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 检测 1: JS 阻塞（大量同步计算）
function detectJSBlocking() {
  log('\n🔴 检测 1: JS 阻塞（大量同步计算）', 'yellow');
  
  const files = getAllFiles('.')
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
  
  const patterns = [
    { pattern: /for\s*\([^)]*\)\s*{[^}]{200,}}/g, desc: '大型 for 循环' },
    { pattern: /while\s*\([^)]*\)\s*{/g, desc: 'while 循环（可能死循环）' },
    { pattern: /\.map\([^)]*\)\.map\(/g, desc: '多重 map（性能差）' },
    { pattern: /\.forEach\([^)]*\)\.forEach\(/g, desc: '多重 forEach' },
    { pattern: /JSON\.parse\(.*JSON\.stringify/g, desc: '深拷贝（性能差）' }
  ];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    patterns.forEach(({ pattern, desc }) => {
      const matches = content.match(pattern);
      if (matches) {
        warnings.push(`${file}: 发现 ${desc} (${matches.length} 处)`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      发现 ${desc} (${matches.length} 处)`, 'yellow');
      }
    });
  });
  
  if (warnings.length === 0) {
    log('   ✅ 未发现明显的 JS 阻塞问题', 'green');
  } else {
    suggestions.push('使用任务分片（chunking）或 Web Worker 处理大量计算');
    suggestions.push('参考: PRODUCTION_PERFORMANCE_OPTIMIZATION.md - 优先级 1');
  }
}

// 检测 2: 事件重复绑定
function detectEventListenerLeaks() {
  log('\n🔴 检测 2: 事件重复绑定', 'yellow');
  
  const files = getAllFiles('.')
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 检测 addEventListener 但没有 removeEventListener
    const addListeners = content.match(/addEventListener\(/g);
    const removeListeners = content.match(/removeEventListener\(/g);
    
    if (addListeners && addListeners.length > 0) {
      if (!removeListeners || removeListeners.length < addListeners.length) {
        issues.push(`${file}: addEventListener (${addListeners.length}) > removeEventListener (${removeListeners?.length || 0})`);
        log(`   ❌ ${file}`, 'red');
        log(`      addEventListener: ${addListeners.length}, removeEventListener: ${removeListeners?.length || 0}`, 'red');
      }
    }
    
    // 检测 useEffect 中的 addEventListener 但没有清理
    const useEffectPattern = /useEffect\(\s*\(\)\s*=>\s*{([^}]+addEventListener[^}]+)}/g;
    const matches = [...content.matchAll(useEffectPattern)];
    
    matches.forEach(match => {
      if (!match[1].includes('removeEventListener') && !match[1].includes('return')) {
        warnings.push(`${file}: useEffect 中有 addEventListener 但可能没有清理`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      useEffect 中可能缺少事件清理`, 'yellow');
      }
    });
  });
  
  if (issues.length === 0 && warnings.length === 0) {
    log('   ✅ 未发现事件监听器泄漏', 'green');
  } else {
    suggestions.push('在 useEffect 的 return 中清理所有事件监听器');
    suggestions.push('或使用 React 事件系统（onClick）代替原生 addEventListener');
  }
}

// 检测 3: 无限请求/API 炸掉
function detectInfiniteRequests() {
  log('\n🔴 检测 3: 无限请求/API 炸掉', 'yellow');
  
  const files = getAllFiles('.')
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 检测高频 setInterval
    const intervalPattern = /setInterval\([^,]+,\s*(\d+)\)/g;
    const matches = [...content.matchAll(intervalPattern)];
    
    matches.forEach(match => {
      const interval = parseInt(match[1]);
      if (interval < 1000) {
        issues.push(`${file}: setInterval 间隔过短 (${interval}ms)`);
        log(`   ❌ ${file}`, 'red');
        log(`      setInterval 间隔过短: ${interval}ms`, 'red');
      }
    });
    
    // 检测 SWR refreshInterval
    const swrPattern = /refreshInterval:\s*(\d+)/g;
    const swrMatches = [...content.matchAll(swrPattern)];
    
    swrMatches.forEach(match => {
      const interval = parseInt(match[1]);
      if (interval < 1000) {
        warnings.push(`${file}: SWR refreshInterval 过短 (${interval}ms)`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      SWR refreshInterval 过短: ${interval}ms`, 'yellow');
      }
    });
    
    // 检测没有 debounce/throttle 的搜索
    if (content.includes('onChange') && content.includes('fetch')) {
      if (!content.includes('debounce') && !content.includes('throttle')) {
        warnings.push(`${file}: onChange 中有 fetch 但没有 debounce/throttle`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      onChange 中可能需要 debounce/throttle`, 'yellow');
      }
    }
  });
  
  if (issues.length === 0 && warnings.length === 0) {
    log('   ✅ 未发现无限请求问题', 'green');
  } else {
    suggestions.push('使用 throttle/debounce 限制请求频率');
    suggestions.push('SWR refreshInterval 建议 >= 3000ms');
  }
}

// 检测 4: DOM 过大
function detectLargeDOMRendering() {
  log('\n🔴 检测 4: DOM 过大（大量渲染）', 'yellow');
  
  const files = getAllFiles('.')
    .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 检测 .map 渲染但没有分页/虚拟列表
    const mapPattern = /{[^}]*\.map\([^)]*=>[^}]*<[^>]+>/g;
    const matches = content.match(mapPattern);
    
    if (matches && matches.length > 0) {
      const hasVirtualList = content.includes('react-window') || 
                            content.includes('FixedSizeList') ||
                            content.includes('VariableSizeList');
      const hasPagination = content.includes('Pagination') || 
                           content.includes('slice(');
      
      if (!hasVirtualList && !hasPagination) {
        warnings.push(`${file}: 使用 .map 渲染但没有分页或虚拟列表`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      .map 渲染可能导致 DOM 过大`, 'yellow');
      }
    }
    
    // 检测大型表格
    if (content.includes('<table') || content.includes('<Table')) {
      if (!content.includes('Pagination') && !content.includes('slice(')) {
        warnings.push(`${file}: 表格可能需要分页`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      表格建议添加分页`, 'yellow');
      }
    }
  });
  
  if (warnings.length === 0) {
    log('   ✅ 未发现 DOM 过大问题', 'green');
  } else {
    suggestions.push('使用 react-window 实现虚拟列表');
    suggestions.push('或添加分页功能');
  }
}

// 检测 5: 图片/资源过大
function detectLargeAssets() {
  log('\n🔴 检测 5: 图片/资源过大', 'yellow');
  
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(publicDir)) {
    log('   ⚠️  public 目录不存在', 'yellow');
    return;
  }
  
  const imageFiles = getAllFiles(publicDir)
    .filter(f => /\.(jpg|jpeg|png|gif|bmp)$/i.test(f));
  
  imageFiles.forEach(file => {
    const stats = fs.statSync(file);
    const sizeMB = stats.size / (1024 * 1024);
    
    if (sizeMB > 1) {
      issues.push(`${file}: 图片过大 (${sizeMB.toFixed(2)} MB)`);
      log(`   ❌ ${file}`, 'red');
      log(`      图片大小: ${sizeMB.toFixed(2)} MB`, 'red');
    } else if (sizeMB > 0.5) {
      warnings.push(`${file}: 图片较大 (${sizeMB.toFixed(2)} MB)`);
      log(`   ⚠️  ${file}`, 'yellow');
      log(`      图片大小: ${sizeMB.toFixed(2)} MB`, 'yellow');
    }
  });
  
  // 检查是否使用 Next.js Image
  const componentFiles = getAllFiles('.')
    .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));
  
  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('<img') && !content.includes('next/image')) {
      warnings.push(`${file}: 使用 <img> 而不是 Next.js Image`);
      log(`   ⚠️  ${file}`, 'yellow');
      log(`      建议使用 next/image 优化图片`, 'yellow');
    }
  });
  
  if (issues.length === 0 && warnings.length === 0) {
    log('   ✅ 未发现图片资源问题', 'green');
  } else {
    suggestions.push('使用 sharp 或 imagemin 压缩图片');
    suggestions.push('转换为 WebP 格式');
    suggestions.push('使用 next/image 自动优化');
  }
}

// 检测 6: 内存泄漏
function detectMemoryLeaks() {
  log('\n🔴 检测 6: 内存泄漏', 'yellow');
  
  const files = getAllFiles('.')
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 检测 setInterval/setTimeout 但没有清理
    const hasSetInterval = content.includes('setInterval');
    const hasSetTimeout = content.includes('setTimeout');
    const hasClearInterval = content.includes('clearInterval');
    const hasClearTimeout = content.includes('clearTimeout');
    
    if (hasSetInterval && !hasClearInterval) {
      warnings.push(`${file}: 有 setInterval 但可能没有 clearInterval`);
      log(`   ⚠️  ${file}`, 'yellow');
      log(`      setInterval 可能没有清理`, 'yellow');
    }
    
    if (hasSetTimeout && !hasClearTimeout) {
      warnings.push(`${file}: 有 setTimeout 但可能没有 clearTimeout`);
      log(`   ⚠️  ${file}`, 'yellow');
      log(`      setTimeout 可能没有清理`, 'yellow');
    }
    
    // 检测 WebSocket 但没有 close
    if (content.includes('new WebSocket') && !content.includes('.close()')) {
      warnings.push(`${file}: 有 WebSocket 但可能没有 close`);
      log(`   ⚠️  ${file}`, 'yellow');
      log(`      WebSocket 可能没有关闭`, 'yellow');
    }
    
    // 检测 useEffect 但没有 return
    const useEffectPattern = /useEffect\(\s*\(\)\s*=>\s*{([^}]+)}\s*,/g;
    const matches = [...content.matchAll(useEffectPattern)];
    
    matches.forEach(match => {
      const body = match[1];
      const hasCleanup = body.includes('return');
      const needsCleanup = body.includes('setInterval') || 
                          body.includes('setTimeout') ||
                          body.includes('addEventListener') ||
                          body.includes('WebSocket');
      
      if (needsCleanup && !hasCleanup) {
        warnings.push(`${file}: useEffect 可能需要清理函数`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      useEffect 可能缺少清理函数`, 'yellow');
      }
    });
  });
  
  if (warnings.length === 0) {
    log('   ✅ 未发现明显的内存泄漏', 'green');
  } else {
    suggestions.push('在 useEffect 的 return 中清理所有副作用');
    suggestions.push('清理: 定时器、事件监听器、WebSocket、订阅');
  }
}

// 检测 7: 状态管理混乱
function detectStateManagementIssues() {
  log('\n🔴 检测 7: 状态管理混乱（无限 re-render）', 'yellow');
  
  const files = getAllFiles('.')
    .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 检测多个 useState
    const useStateMatches = content.match(/useState\(/g);
    if (useStateMatches && useStateMatches.length > 5) {
      warnings.push(`${file}: 使用了 ${useStateMatches.length} 个 useState`);
      log(`   ⚠️  ${file}`, 'yellow');
      log(`      useState 过多 (${useStateMatches.length} 个)，考虑使用 useReducer`, 'yellow');
    }
    
    // 检测 useEffect 依赖对象/数组
    const effectPattern = /useEffect\([^,]+,\s*\[([^\]]+)\]\)/g;
    const matches = [...content.matchAll(effectPattern)];
    
    matches.forEach(match => {
      const deps = match[1];
      if (deps.includes('{') || deps.includes('[')) {
        warnings.push(`${file}: useEffect 依赖包含对象或数组`);
        log(`   ⚠️  ${file}`, 'yellow');
        log(`      useEffect 依赖包含对象/数组，可能导致无限循环`, 'yellow');
      }
    });
    
    // 检测没有使用 useMemo/useCallback
    const hasExpensiveCalc = content.includes('.sort(') || 
                            content.includes('.filter(') ||
                            content.includes('.reduce(');
    const hasUseMemo = content.includes('useMemo');
    const hasUseCallback = content.includes('useCallback');
    
    if (hasExpensiveCalc && !hasUseMemo) {
      warnings.push(`${file}: 有复杂计算但没有使用 useMemo`);
      log(`   ⚠️  ${file}`, 'yellow');
      log(`      建议使用 useMemo 缓存计算结果`, 'yellow');
    }
  });
  
  if (warnings.length === 0) {
    log('   ✅ 未发现状态管理问题', 'green');
  } else {
    suggestions.push('使用 useReducer 替代多个 useState');
    suggestions.push('使用 useMemo 缓存计算结果');
    suggestions.push('使用 useCallback 稳定函数引用');
  }
}

// 生成报告
function generateReport() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 性能问题检测报告 / Performance Issues Report', 'cyan');
  log('='.repeat(60), 'cyan');
  
  if (issues.length === 0 && warnings.length === 0) {
    log('\n✅ 未发现严重的性能问题！', 'green');
    log('\n💡 建议:', 'cyan');
    log(' 1. 定期运行此检测工具', 'cyan');
    log(' 2. 使用 React DevTools Profiler 监控性能', 'cyan');
    log(' 3. 查看 PRODUCTION_PERFORMANCE_OPTIMIZATION.md', 'cyan');
  } else {
    if (issues.length > 0) {
      log('\n❌ 发现严重问题:', 'red');
      issues.forEach((issue, i) => log(`   ${i + 1}. ${issue}`, 'red'));
    }
    
    if (warnings.length > 0) {
      log('\n⚠️  发现警告:', 'yellow');
      warnings.forEach((warning, i) => log(`   ${i + 1}. ${warning}`, 'yellow'));
    }
    
    if (suggestions.length > 0) {
      log('\n💡 修复建议:', 'cyan');
      // 去重
      const uniqueSuggestions = [...new Set(suggestions)];
      uniqueSuggestions.forEach((suggestion, i) => 
        log(`   ${i + 1}. ${suggestion}`, 'cyan')
      );
    }
  }
  
  log('\n📚 详细优化指南:', 'blue');
  log('   - PRODUCTION_PERFORMANCE_OPTIMIZATION.md', 'blue');
  log('   - PAGE_FREEZE_AUTO_FIX_GUIDE.md', 'blue');
  log('   - PAGE_FREEZE_SOLUTION_SUMMARY.md\n', 'blue');
}

// 主函数
async function main() {
  log('\n🔍 评分系统性能问题自动检测工具', 'cyan');
  log('   检测 7 大常见性能问题\n', 'cyan');
  
  try {
    detectJSBlocking();
    detectEventListenerLeaks();
    detectInfiniteRequests();
    detectLargeDOMRendering();
    detectLargeAssets();
    detectMemoryLeaks();
    detectStateManagementIssues();
    
    generateReport();
  } catch (error) {
    log(`\n❌ 检测过程中出错: ${error.message}`, 'red');
    console.error(error);
  }
}

main();

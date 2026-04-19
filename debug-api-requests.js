// 实时监控所有 API 请求的脚本
// 在浏览器控制台中运行此脚本来追踪请求来源

console.log('🔍 开始监控 API 请求...');

// 保存原始的 fetch 函数
const originalFetch = window.fetch;

// 重写 fetch 函数来监控所有请求
window.fetch = function(...args) {
  const url = args[0];
  const options = args[1] || {};
  
  // 检查是否是 API 请求
  if (typeof url === 'string' && url.includes('/api/')) {
    console.log('🚨 API 请求被发送:', {
      url: url,
      method: options.method || 'GET',
      headers: options.headers || {},
      hasAuthToken: !!(options.headers && options.headers.Authorization),
      stack: new Error().stack
    });
    
    // 特别关注 competitions API
    if (url.includes('/api/competitions')) {
      console.error('❌ COMPETITIONS API 请求:', {
        url: url,
        method: options.method || 'GET',
        headers: options.headers || {},
        hasAuthToken: !!(options.headers && options.headers.Authorization),
        localStorage_token: localStorage.getItem('auth_token'),
        stack: new Error().stack
      });
    }
  }
  
  // 调用原始的 fetch 函数
  return originalFetch.apply(this, args);
};

// 监控 XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...args) {
  if (typeof url === 'string' && url.includes('/api/')) {
    console.log('🚨 XHR API 请求:', {
      method: method,
      url: url,
      stack: new Error().stack
    });
  }
  return originalXHROpen.apply(this, [method, url, ...args]);
};

console.log('✅ API 请求监控已启动');
console.log('现在访问页面，所有 API 请求都会被记录');
console.log('特别关注带有 ❌ 标记的 competitions API 请求');

// 检查当前认证状态
console.log('🔐 当前认证状态:', {
  auth_token: localStorage.getItem('auth_token'),
  auth_user: localStorage.getItem('auth_user'),
  hasToken: !!localStorage.getItem('auth_token')
});

// 提供清除认证数据的快捷方法
window.clearAuth = function() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  console.log('🧹 认证数据已清除');
};

console.log('💡 使用 clearAuth() 来清除认证数据');
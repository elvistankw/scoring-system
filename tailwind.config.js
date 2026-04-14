/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './interface/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': [
          // 中文字体
          'PingFang SC',
          'Hiragino Sans GB', 
          'Microsoft YaHei',
          '微软雅黑',
          // 英文字体
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          // 通用后备字体
          'Noto Sans',
          'Liberation Sans',
          'sans-serif',
          // Emoji 字体
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji'
        ]
      }
    },
  },
  plugins: [],
}

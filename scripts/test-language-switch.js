// 测试语言切换功能
console.log('=== 语言切换测试 ===');

// 1. 检查当前localStorage中的语言设置
const currentLanguage = localStorage.getItem('language');
console.log('当前localStorage中的语言设置:', currentLanguage);

// 2. 设置默认语言为英文
localStorage.setItem('language', 'en');
console.log('已设置默认语言为英文');

// 3. 清除localStorage中的语言设置（测试默认行为）
// localStorage.removeItem('language');
// console.log('已清除localStorage中的语言设置');

// 4. 检查浏览器语言偏好
const browserLanguage = navigator.language || navigator.userLanguage;
console.log('浏览器语言偏好:', browserLanguage);

// 5. 检查是否支持中文
const supportsChinese = navigator.languages && navigator.languages.some(lang => 
  lang.startsWith('zh') || lang.startsWith('zh-CN') || lang.startsWith('zh-TW')
);
console.log('浏览器是否支持中文:', supportsChinese);

console.log('=== 测试完成 ===');
console.log('请刷新页面查看效果'); 
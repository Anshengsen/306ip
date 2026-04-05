document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const root = document.documentElement;
    
    // 1. 初始化
    const savedTheme = localStorage.getItem('theme') || 'dark';
    root.setAttribute('data-theme', savedTheme);
    
    // 2. 绑定事件
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 获取当前主题
            const currentTheme = root.getAttribute('data-theme');
            
            // 判断并切换到相反的主题
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // 将新主题应用到 HTML 根节点
            root.setAttribute('data-theme', newTheme);
            
            // 将新主题保存到本地存储
            localStorage.setItem('theme', newTheme);
        });
    }
});
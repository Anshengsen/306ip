document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素获取
    const sidebarContainer = document.getElementById('sidebar-menu-container');
    const gridContainer = document.getElementById('case-grid-container');
    const paginationContainer = document.getElementById('pagination-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    const mediaModal = document.getElementById('media-modal');
    const mediaModalCloseBtn = document.getElementById('media-modal-close-btn');
    const modalMediaImg = document.getElementById('modal-media-img');
    
    const sortDropdown = document.getElementById('sort-dropdown');
    const sortSelectedText = document.getElementById('sort-selected-text');
    const sortDropdownItems = document.querySelectorAll('.sort-dropdown-item');
    
    const viewModeDropdown = document.getElementById('view-mode-dropdown');
    const viewModeSelectedText = document.getElementById('view-mode-selected-text');
    const viewModeItems = document.querySelectorAll('.view-mode-item');
    
    const mainContent = document.querySelector('.main-content');
    const columnSlider = document.getElementById('column-slider');

    // 状态变量
    let allItems = [];
    let currentItems = [];
    let currentPage = 1;
    const pageSize = 20; 
    let currentActiveLink = null;
    let currentSortMode = 'desc'; 
    let currentCategory = null;
    let viewMode = 'pagination'; 
    let isLoading = false;

    // 显示/隐藏加载动画
    const showLoading = (show) => {
        loadingIndicator.style.display = show ? 'block' : 'none';
        if (show) {
            gridContainer.style.display = 'none';
            paginationContainer.style.display = 'none';
        } else {
            gridContainer.style.display = 'block';
            if (viewMode === 'pagination') {
                paginationContainer.style.display = 'flex';
            }
        }
    };

    // 构建左侧分类菜单
    const buildMenu = (categories) => {
        const menuContainer = document.createElement('div');
        menuContainer.className = 'menu-content';
        
        let menuHtml = `<a href="#" class="active" data-level="0">全部图片</a>`;
        
        categories.forEach(l1 => {
            menuHtml += `<details class="level-1"><summary data-level="1" data-l1="${l1.name}">${l1.name}</summary>`;
            l1.subcategories.forEach(l2 => {
                menuHtml += `<div class="level-2"><details><summary data-level="2" data-l1="${l1.name}" data-l2="${l2.name}">${l2.name}</summary>`;
                l2.groups.forEach(l3 => {
                    menuHtml += `<div class="level-3"><a href="#" data-level="3" data-l1="${l1.name}" data-l2="${l2.name}" data-l3="${l3.name}">${l3.name}</a></div>`;
                });
                menuHtml += `</details></div>`;
            });
            menuHtml += `</details>`;
        });
        menuContainer.innerHTML = menuHtml;
        
        sidebarContainer.innerHTML = '';
        sidebarContainer.appendChild(menuContainer);
        
        currentActiveLink = sidebarContainer.querySelector('.menu-content a:first-child');
    };

    // 渲染图片网格
    const renderGrid = (itemsToRender, append = false) => {
        if (!append) {
            gridContainer.innerHTML = '';
        }
        
        if (!itemsToRender || itemsToRender.length === 0) {
            if (!append) {
                gridContainer.innerHTML = `<p style="text-align: center; width: 100%; color: var(--text-secondary); padding: 40px;">暂无图片</p>`;
            }
            return;
        }

        itemsToRender.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'case-item';
            itemDiv.dataset.itemId = item.previewPath; 
            
            itemDiv.innerHTML = `
                <img src="${item.previewPath}" alt="${item.id}" loading="lazy" oncontextmenu="return false;">
                <div class="case-overlay">
                    <div class="file-name" title="${item.id}">${item.id}</div>
                </div>`;
            gridContainer.appendChild(itemDiv);
        });
    };

    // 渲染分页控件
    const renderPagination = (totalItems) => {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages <= 1) return;

        let paginationHTML = `<a href="#" data-page="${currentPage > 1 ? currentPage - 1 : 1}">&laquo;</a>`;

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        if (currentPage <= 3) endPage = Math.min(5, totalPages);
        if (currentPage > totalPages - 3) startPage = Math.max(1, totalPages - 4);

        if (startPage > 1) {
            paginationHTML += `<a href="#" data-page="1">1</a>`;
            if (startPage > 2) paginationHTML += `<span>...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationHTML += `<span>...</span>`;
            paginationHTML += `<a href="#" data-page="${totalPages}">${totalPages}</a>`;
        }

        paginationHTML += `<a href="#" data-page="${currentPage < totalPages ? currentPage + 1 : totalPages}">&raquo;</a>`;
        paginationHTML += `<span class="pagination-jump">跳转至 <input type="number" id="page-jump-input" min="1" max="${totalPages}"> 页</span>`;
        paginationContainer.innerHTML = paginationHTML;
    };

    // 显示指定页
    const displayPage = (page) => {
        currentPage = page;
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        renderGrid(currentItems.slice(start, end));
        renderPagination(currentItems.length);
        
        // 滚动回顶部
        if (window.innerWidth <= 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            mainContent.scrollTop = 0;
        }
    };

    // 无限滚动加载更多
    const loadMoreItems = () => {
        if (isLoading || viewMode !== 'infinite') return;
        
        const start = gridContainer.children.length;
        const end = start + pageSize;
        
        if (start >= currentItems.length) return;
        
        isLoading = true;
        renderGrid(currentItems.slice(start, end), true);
        isLoading = false;
    };

    // 更新内容显示
    const updateContent = (items) => {
        currentItems = items;
        if (viewMode === 'pagination') {
            displayPage(1);
        } else {
            renderGrid(currentItems.slice(0, pageSize));
        }
    };

    // 扁平化数据结构
    const flattenData = (categories) => {
        let flatList = [];
        categories.forEach(l1 => l1.subcategories.forEach(l2 => l2.groups.forEach(l3 => l3.items.forEach(item => {
            flatList.push({ ...item, l1: l1.name, l2: l2.name, l3: l3.name });
        }))));
        return flatList;
    };

    // 应用排序（支持数字自然排序）
    const applySorting = (items) => {
        let sortedItems = [...items];
        if (currentSortMode === 'desc') {
            sortedItems.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' }));
        } else {
            sortedItems.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
        }
        return sortedItems;
    };

    // 刷新内容（过滤 + 排序）
    const refreshContent = () => {
        let items = allItems;
        
        // 分类过滤
        if (currentCategory) {
            const { level, l1, l2, l3 } = currentCategory;
            if (level === '1') items = items.filter(i => i.l1 === l1);
            else if (level === '2') items = items.filter(i => i.l1 === l1 && i.l2 === l2);
            else if (level === '3') items = items.filter(i => i.l1 === l1 && i.l2 === l2 && i.l3 === l3);
        }
        
        items = applySorting(items);
        updateContent(items);
    };

    // 打开大图模态框
    const openMediaModal = (item) => {
        modalMediaImg.src = item.originalPath || item.previewPath;
        mediaModal.classList.add('visible');
    };

    // 初始化数据
    async function initContent() {
        showLoading(true);
        try {
            const response = await fetch('data.json');
            const data = await response.json();
            allItems = flattenData(data.categories);
            buildMenu(data.categories);
            refreshContent();
        } catch (e) {
            console.error("数据加载失败:", e);
            gridContainer.innerHTML = `<p style="text-align: center; width: 100%; color: var(--error-color);">数据加载失败，请检查 data.json 文件</p>`;
        } finally {
            showLoading(false);
        }
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 列数滑块
        if (columnSlider) {
            columnSlider.addEventListener('input', e => {
                gridContainer.style.setProperty('--columns', e.target.value);
            });
        }

        // 排序下拉菜单
        const sortDropdownToggle = sortDropdown.querySelector('.sort-dropdown-toggle');
        sortDropdownToggle.addEventListener('click', () => {
            sortDropdown.classList.toggle('open');
        });

        sortDropdownItems.forEach(item => {
            item.addEventListener('click', () => {
                sortDropdownItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentSortMode = item.dataset.value;
                sortSelectedText.textContent = item.textContent;
                sortDropdown.classList.remove('open');
                refreshContent();
            });
        });

        // 视图模式下拉菜单
        const viewModeToggle = viewModeDropdown.querySelector('.view-mode-toggle');
        viewModeToggle.addEventListener('click', () => {
            viewModeDropdown.classList.toggle('open');
        });

        viewModeItems.forEach(item => {
            item.addEventListener('click', () => {
                viewModeItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                viewMode = item.dataset.value;
                viewModeSelectedText.textContent = item.textContent;
                viewModeDropdown.classList.remove('open');
                
                if (viewMode === 'pagination') {
                    paginationContainer.style.display = 'flex';
                    displayPage(1);
                } else {
                    paginationContainer.style.display = 'none';
                    renderGrid(currentItems.slice(0, pageSize));
                }
            });
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!sortDropdown.contains(e.target)) sortDropdown.classList.remove('open');
            if (!viewModeDropdown.contains(e.target)) viewModeDropdown.classList.remove('open');
        });

        // 侧边栏分类点击
        sidebarContainer.addEventListener('click', e => {
            const target = e.target.closest('a') || e.target.closest('summary');
            if (!target) return;
            if (target.tagName === 'SUMMARY') {
                e.preventDefault();
                target.parentElement.toggleAttribute('open');
                return;
            }
            e.preventDefault();
            if (currentActiveLink) currentActiveLink.classList.remove('active');
            target.classList.add('active');
            currentActiveLink = target;
            
            const { level, l1, l2, l3 } = target.dataset;
            currentCategory = level === '0' ? null : { level, l1, l2, l3 };
            refreshContent();
            
            if (window.innerWidth <= 768) {
                sidebarContainer.classList.remove('open');
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) overlay.classList.remove('active');
            }
        });

        // 图片点击查看大图
        gridContainer.addEventListener('click', e => {
            const caseItem = e.target.closest('.case-item');
            if (caseItem) {
                const itemPath = caseItem.dataset.itemId;
                const item = allItems.find(i => i.previewPath === itemPath);
                if (item) openMediaModal(item);
            }
        });

        // 模态框关闭
        mediaModalCloseBtn.addEventListener('click', () => mediaModal.classList.remove('visible'));
        mediaModal.addEventListener('click', e => { 
            if (e.target === mediaModal) mediaModal.classList.remove('visible');
        });

        // 分页点击
        paginationContainer.addEventListener('click', e => {
            if (e.target.tagName === 'A' && e.target.dataset.page) {
                e.preventDefault();
                const newPage = parseInt(e.target.dataset.page, 10);
                if (newPage !== currentPage) displayPage(newPage);
            }
        });

        // 分页输入跳转
        paginationContainer.addEventListener('change', e => {
            if (e.target.id === 'page-jump-input') {
                const page = parseInt(e.target.value, 10);
                const totalPages = Math.ceil(currentItems.length / pageSize);
                if (page >= 1 && page <= totalPages) displayPage(page);
                else e.target.value = '';
            }
        });

        // 禁用全局图片右键
        document.addEventListener('contextmenu', e => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
            }
        });

        // 返回顶部按钮
        const backToTopBtn = document.createElement('div');
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.innerHTML = `
            <div class="rocket">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5z"/>
                </svg>
            </div>
        `;
        document.body.appendChild(backToTopBtn);

        const handleScroll = () => {
            const target = window.innerWidth <= 768 ? window : mainContent;
            const scrollTop = target === window ? window.scrollY : target.scrollTop;
            
            if (scrollTop > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }

            if (viewMode === 'infinite' && mainContent) {
                const scrollHeight = target === window ? document.body.offsetHeight : target.scrollHeight;
                const clientHeight = target === window ? window.innerHeight : target.clientHeight;
                
                if (clientHeight + scrollTop >= scrollHeight - 800) {
                    loadMoreItems();
                }
            }
        };

        window.addEventListener('scroll', () => { if (window.innerWidth <= 768) handleScroll(); });
        if (mainContent) mainContent.addEventListener('scroll', () => { if (window.innerWidth > 768) handleScroll(); });

        backToTopBtn.addEventListener('click', () => {
            const target = window.innerWidth <= 768 ? window : mainContent;
            target.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // 移动端汉堡菜单
        const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
        const overlay = document.querySelector('.sidebar-overlay') || document.createElement('div');
        if (!overlay.parentNode) {
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebarContainer.classList.toggle('open');
                overlay.classList.toggle('active');
            });
        }

        overlay.addEventListener('click', () => {
            sidebarContainer.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // 启动
    initContent();
    setupEventListeners();
});
// sidebar.js
(function() {
    let sidebarElement;
    let pinToggleBtn;
    let menuHoverTriggerBtn;
    let mainContentEl;
    let isPinned = localStorage.getItem('sidebarPinned') === 'true';
    let hideTimeout;

    function initializeSidebar() {
        sidebarElement = document.querySelector('.sidebar');
        pinToggleBtn = document.getElementById('pinToggle');
        menuHoverTriggerBtn = document.querySelector('.menu-hover-trigger');
        mainContentEl = document.querySelector('.main-content');

        if (!sidebarElement) return;

        // وضعیت اولیه را بر اساس کلاس بادی سینک می‌کنیم
        if (document.body.classList.contains('sidebar-pinned')) {
            isPinned = true;
        }

        // فعال‌سازی دکمه پین
        if (pinToggleBtn) {
            const newPinBtn = pinToggleBtn.cloneNode(true);
            pinToggleBtn.parentNode.replaceChild(newPinBtn, pinToggleBtn);
            pinToggleBtn = newPinBtn;

            pinToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                isPinned = !isPinned;
                localStorage.setItem('sidebarPinned', isPinned);
                
                // تغییر کلاس بادی به جای دستکاری مستقیم استایل‌ها
                if (isPinned) {
                    document.body.classList.add('sidebar-pinned');
                } else {
                    document.body.classList.remove('sidebar-pinned');
                }
            });
        }

        setupAccordion();
        setupHoverListeners();
        highlightActivePage();
        setupResponsive();
        updateCurrentDate();
        
        // برگرداندن ترنزیشن که در CSS حذف شده بود (بعد از لود کامل)
        setTimeout(() => {
            if (sidebarElement) sidebarElement.style.transition = '';
            if (mainContentEl) mainContentEl.style.transition = '';
        }, 500);
    }

    // بقیه توابع (highlightActivePage, setupAccordion, etc) مثل قبل بمانند...
    // فقط تابع updatePinState دیگر نیاز نیست چون با CSS کلاس بادی کنترل می‌شود.

function setupAccordion() {
    const headers = document.querySelectorAll('.nav-section h3');
    
    headers.forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const parentSection = this.closest('.nav-section');
            const isActive = parentSection.classList.contains('active');
            
            // بستن تمام section‌های دیگر
            if (!isActive) {
                const allSections = document.querySelectorAll('.nav-section');
                allSections.forEach(section => {
                    section.classList.remove('active');
                });
            }
            
            // باز کردن section جاری
            parentSection.classList.toggle('active');
        });
    });
}
    
function highlightActivePage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-section ul li a');
    
    // ابتدا همه section‌ها را ببندید
    const allSections = document.querySelectorAll('.nav-section');
    allSections.forEach(section => {
        section.classList.remove('active');
    });
    
    links.forEach(link => {
        link.classList.remove('active-link');
        const linkHref = link.getAttribute('href');
        
        if (linkHref === currentPage || linkHref.endsWith('/' + currentPage)) {
            link.classList.add('active-link');
            const parentSection = link.closest('.nav-section');
            if (parentSection) {
                // فقط section مربوطه را باز کنید
                parentSection.classList.add('active');
            }
        }
    });
}






















    function setupHoverListeners() {
        if (!menuHoverTriggerBtn || !sidebarElement) return;
        function showSidebar() {
            // اگر پین است، کاری نکن (CSS هندل می‌کند)
            if (document.body.classList.contains('sidebar-pinned')) return;
            clearTimeout(hideTimeout);
            sidebarElement.style.opacity = '1';
            sidebarElement.style.visibility = 'visible';
            sidebarElement.style.right = '0';
        }
        function hideSidebar() {
            if (document.body.classList.contains('sidebar-pinned')) return;
            hideTimeout = setTimeout(() => {
                if (!document.body.classList.contains('sidebar-pinned')) {
                    sidebarElement.style.opacity = '0';
                    sidebarElement.style.visibility = 'hidden';
                    sidebarElement.style.right = '-250px';
                }
            }, 300);
        }
        menuHoverTriggerBtn.addEventListener('mouseenter', showSidebar);
        menuHoverTriggerBtn.addEventListener('mouseleave', hideSidebar);
        sidebarElement.addEventListener('mouseenter', showSidebar);
        sidebarElement.addEventListener('mouseleave', hideSidebar);
    }

    function setupResponsive() { /* کد قبلی */ 
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle && sidebarElement) {
            menuToggle.onclick = function() {
                sidebarElement.classList.toggle('active');
                if(sidebarElement.style.right === '0px') sidebarElement.style.right = '-250px';
                else sidebarElement.style.right = '0px';
            };
        }
    }
    
    function updateCurrentDate() {
        const el = document.getElementById('currentDate');
        if (el) el.innerText = new Date().toLocaleDateString('fa-IR');
    }

    initializeSidebar();
})();
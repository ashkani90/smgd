// فایل: components/pages-footer/footer.js

class CMMSFooter {
    constructor() {
        this.footerLoaded = false;
        this.init();
    }

    init() {
        this.loadFooter();
        this.bindEvents();
        this.setCurrentDate();
    }

    async loadFooter() {
        try {
            const response = await fetch('../components/pages-footer/footer.html');
            const footerHTML = await response.text();
            
            // اضافه کردن فوتر به انتهای main-content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.insertAdjacentHTML('beforeend', footerHTML);
                this.footerLoaded = true;
                
                // بارگذاری استایل‌ها
                this.loadStyles();
                
                // اجرای اسکریپت‌های فوتر
                this.initFooterScripts();
                
                console.log('Footer loaded successfully');
            }
        } catch (error) {
            console.error('Error loading footer:', error);
            this.loadFallbackFooter();
        }
    }

    loadStyles() {
        // اگر استایل هنوز لود نشده باشد
        const existingStyle = document.querySelector('link[href*="footer.css"]');
        if (!existingStyle) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../components/pages-footer/footer.css';
            document.head.appendChild(link);
        }
    }

    loadFallbackFooter() {
        const fallbackHTML = `
            <footer class="cmms-footer">
                <div class="footer-bottom">
                    <div class="footer-container">
                        <div class="copyright">
                            <p>© ۲۰۲۶ - سیستم جامع نگهداری و تعمیرات <strong>CMMS Pro</strong></p>
                            <p class="version-info">نسخه ۰.۰.۱ | آخرین بروزرسانی: ۱۴۰۴/۱۰/۱۱</p>
                            <p>محمــد پورسـان دلیــر - ۰۹۱۲۷۵۵۷۳۱۵</p>
                        </div>
                    </div>
                </div>
            </footer>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('beforeend', fallbackHTML);
        }
    }

    setCurrentDate() {
        // تنظیم تاریخ شمسی
        const jalaliDate = this.getJalaliDate();
        const dateElement = document.getElementById('lastUpdateDate');
        if (dateElement) {
            dateElement.textContent = jalaliDate;
        }
    }

    getJalaliDate() {
        // تابع تبدیل تاریخ میلادی به شمسی (ساده شده)
        const now = new Date();
        const jalaliDate = now.toLocaleDateString('fa-IR');
        return jalaliDate;
    }

    bindEvents() {
        // رویداد اسکرول برای دکمه بازگشت به بالا
        window.addEventListener('scroll', () => {
            this.toggleBackToTop();
        });

        // رویداد کلیک برای دکمه بازگشت به بالا
        document.addEventListener('click', (e) => {
            if (e.target.closest('#backToTop')) {
                this.scrollToTop();
            }
        });
    }

    toggleBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    initFooterScripts() {
        // اضافه کردن افکت hover به لینک‌ها
        this.addHoverEffects();
        
        // باز کردن لینک‌های خارجی در تب جدید
        this.handleExternalLinks();
    }

    addHoverEffects() {
        const links = document.querySelectorAll('.footer-links a, .policy-link');
        links.forEach(link => {
            link.addEventListener('mouseenter', (e) => {
                const icon = e.target.querySelector('i');
                if (icon) {
                    icon.style.transform = 'translateX(-3px)';
                }
            });
            
            link.addEventListener('mouseleave', (e) => {
                const icon = e.target.querySelector('i');
                if (icon) {
                    icon.style.transform = 'translateX(0)';
                }
            });
        });
    }

    handleExternalLinks() {
        const allLinks = document.querySelectorAll('.cmms-footer a');
        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('http')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    // تابع برای به‌روزرسانی نسخه
    updateVersion(version) {
        const versionElements = document.querySelectorAll('.version-info span');
        versionElements.forEach(el => {
            if (el.textContent.includes('نسخه')) {
                el.textContent = `نسخه ${version}`;
            }
        });
    }
}

// راه‌اندازی فوتر
document.addEventListener('DOMContentLoaded', () => {
    window.cmmsFooter = new CMMSFooter();
});

// تابع برای استفاده در سایر اسکریپت‌ها
function loadFooterComponent() {
    if (!window.cmmsFooter) {
        window.cmmsFooter = new CMMSFooter();
    }
    return window.cmmsFooter;
}

// export برای استفاده در ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CMMSFooter, loadFooterComponent };
}
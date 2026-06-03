// js/i18n.js
class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('preferred_language') || 'fa';
        this.translations = {};
        this.availableLangs = ['fa', 'en', 'ar', 'fr'];
        this.init();
    }

    async init() {
        await this.loadTranslations(this.currentLang);
        this.applyDirection();
        this.updateContent();
        this.setupLanguageSelector();
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`./locales/${lang}.json`);
            this.translations = await response.json();
            document.documentElement.lang = this.translations.meta.lang;
            document.title = this.translations.meta.title;
        } catch (error) {
            console.error('Error loading translations:', error);
            // بارگذاری زبان پیش‌فرض در صورت خطا
            if (lang !== 'fa') {
                await this.loadTranslations('fa');
            }
        }
    }

    applyDirection() {
        const dir = this.translations.meta.dir;
        document.documentElement.dir = dir;
        
        // تنظیم فونت برای زبان‌های مختلف
        if (dir === 'rtl') {
            document.body.style.fontFamily = "'Vazir', 'Segoe UI', Tahoma, sans-serif";
        } else {
            document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        }
    }

    translate(key) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value[k] === undefined) {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
            value = value[k];
        }
        
        return value;
    }

    updateContent() {
        // به‌روزرسانی تمام عناصر دارای data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            
            if (typeof translation === 'string') {
                element.textContent = translation;
            }
        });

        // به‌روزرسانی placeholderها
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.translate(key);
        });

        // به‌روزرسانی titleها
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.translate(key);
        });

        // به‌روزرسانی ویژگی‌های alt
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            element.alt = this.translate(key);
        });

        // به‌روزرسانی لیست‌ها
        this.updateLists();
        
        // به‌روزرسانی متن انتخابگر زبان
        this.updateLanguageSelectorText();
    }

    updateLists() {
        // به‌روزرسانی ویژگی‌ها
        const featuresContainer = document.querySelector('.features-grid');
        if (featuresContainer) {
            const features = this.translate('features.items');
            if (Array.isArray(features)) {
                featuresContainer.innerHTML = features.map((feature, index) => `
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas ${this.getFeatureIcon(index)}"></i>
                        </div>
                        <h3>${feature.title}</h3>
                        <p>${feature.description}</p>
                    </div>
                `).join('');
            }
        }

        // به‌روزرسانی مزایا
        const benefitsContainer = document.querySelector('.benefits-list');
        if (benefitsContainer) {
            const benefits = this.translate('benefits.items');
            if (Array.isArray(benefits)) {
                benefitsContainer.innerHTML = benefits.map((benefit, index) => `
                    <div class="benefit-item">
                        <div class="benefit-icon">
                            <i class="fas ${this.getBenefitIcon(index)}"></i>
                        </div>
                        <div class="benefit-text">
                            <h4>${benefit.title}</h4>
                            <p>${benefit.description}</p>
                        </div>
                    </div>
                `).join('');
            }
        }

        // به‌روزرسانی کارت‌های دسترسی
        this.updateAccessCards();
    }

    updateAccessCards() {
        const accessOptions = document.querySelector('.access-options');
        if (accessOptions) {
            const dashboard = this.translate('access.dashboard');
            const guide = this.translate('access.guide');
            
            accessOptions.innerHTML = `
                <div class="access-card">
                    <h3>${dashboard.title}</h3>
                    <ul>
                        ${dashboard.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <a href="login.html" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-sign-in-alt"></i> ${dashboard.button}
                    </a>
                </div>
                
                <div class="access-card">
                    <h3>${guide.title}</h3>
                    <ul>
                        ${guide.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <a href="#help" class="btn btn-secondary" style="width: 100%;">
                        <i class="fas fa-book"></i> ${guide.button}
                    </a>
                </div>
            `;
        }
    }

    getFeatureIcon(index) {
        const icons = [
            'fa-calendar-check',
            'fa-clipboard-list',
            'fa-boxes',
            'fa-chart-line',
            'fa-mobile-alt',
            'fa-bell'
        ];
        return icons[index] || 'fa-star';
    }

    getBenefitIcon(index) {
        const icons = [
            'fa-money-bill-wave',
            'fa-chart-line',
            'fa-shield-alt',
            'fa-clipboard-check'
        ];
        return icons[index] || 'fa-check';
    }

    setupLanguageSelector() {
        // ایجاد انتخابگر زبان اگر وجود ندارد
        if (!document.querySelector('.language-selector').hasChildNodes()) {
            this.createLanguageSelector();
        } else {
            // اگر وجود دارد، مقدار آن را تنظیم کن
            this.updateLanguageSelectorValue();
        }
    }

    createLanguageSelector() {
        const header = document.querySelector('header');
        if (header) {
            const selectorDiv = document.querySelector('.language-selector');
            if (selectorDiv) {
                // پاک کردن محتوای قبلی
                selectorDiv.innerHTML = '';
                
                // ایجاد ساختار انتخابگر با برچسب
                const selectorHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: white; font-size: 0.95rem;" data-i18n="language.selector">زبان</span>
                        <select id="languageSelect" class="lang-select">
                            ${this.availableLangs.map(lang => `
                                <option value="${lang}" ${this.currentLang === lang ? 'selected' : ''}>
                                    ${this.translate(`language.${lang}`)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
                
                selectorDiv.innerHTML = selectorHTML;
                
                // اضافه کردن رویداد به انتخابگر
                const selector = document.getElementById('languageSelect');
                if (selector) {
                    selector.addEventListener('change', (e) => {
                        this.changeLanguage(e.target.value);
                    });
                }
            }
        }
    }

    updateLanguageSelectorValue() {
        const selector = document.getElementById('languageSelect');
        if (selector) {
            selector.value = this.currentLang;
        }
    }

    updateLanguageSelectorText() {
        // به‌روزرسانی متن برچسب زبان
        const selectorLabel = document.querySelector('.language-selector span[data-i18n="language.selector"]');
        if (selectorLabel) {
            selectorLabel.textContent = this.translate('language.selector');
        }
        
        // به‌روزرسانی متن گزینه‌های انتخابگر
        const selector = document.getElementById('languageSelect');
        if (selector) {
            Array.from(selector.options).forEach(option => {
                option.textContent = this.translate(`language.${option.value}`);
            });
        }
    }

    async changeLanguage(lang) {
        if (this.availableLangs.includes(lang)) {
            this.currentLang = lang;
            localStorage.setItem('preferred_language', lang);
            await this.loadTranslations(lang);
            this.applyDirection();
            this.updateContent();
            
            // به‌روزرسانی مقدار انتخابگر
            this.updateLanguageSelectorValue();
            
            // رویداد تغییر زبان
            this.dispatchLanguageChangeEvent(lang);
        }
    }

    dispatchLanguageChangeEvent(lang) {
        const event = new CustomEvent('languageChanged', {
            detail: { language: lang }
        });
        document.dispatchEvent(event);
    }
}

// ایجاد نمونه از کلاس بعد از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18nManager();
});
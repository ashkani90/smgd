// js/main.js
// اسکریپت‌های اصلی برنامه (بدون کدهای منو)
(function checkLogin() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        if (!userData.loggedIn) {
            window.location.href = '/login.html';
        }
    } catch (e) {
        window.location.href = '/login.html';
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    // 1. تاریخ شمسی جاری
    function getCurrentJalaliDate() {
        const now = new Date();
        const gregorianYear = now.getFullYear();
        const gregorianMonth = now.getMonth() + 1;
        const gregorianDay = now.getDate();
        
        // تبدیل تاریخ میلادی به شمسی (ساده‌سازی شده)
        const gregorianToJalali = (gYear, gMonth, gDay) => {
            // این یک تبدیل ساده است. برای دقت بیشتر از کتابخانه استفاده کنید
            const jYear = gYear - 621;
            let jMonth, jDay;
            
            if (gMonth <= 3) {
                jMonth = gMonth + 9;
                jDay = gDay;
            } else {
                jMonth = gMonth - 3;
                jDay = gDay;
            }
            
            // تنظیم روز و ماه برای نمایش دو رقمی
            jMonth = jMonth < 10 ? '0' + jMonth : jMonth;
            jDay = jDay < 10 ? '0' + jDay : jDay;
            
            return `${jYear}/${jMonth}/${jDay}`;
        };
        
        return gregorianToJalali(gregorianYear, gregorianMonth, gregorianDay);
    }

    // نمایش تاریخ در هدر
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const today = getCurrentJalaliDate();
        dateElement.textContent = today;
    }

    // 2. مدیریت فرم‌ها
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
        
        // یک لیست (آرایه) از فرم‌های مجاز ایجاد می‌کند
        const allowedForms = ['workRequestForm', 'loginForm'];
        // بررسی می‌کند آیا form.id (شناسه فرم فعلی) در لیست فرم‌های مجاز وجود دارد یا نه
        if (!allowedForms.includes(form.id)) {
            // اگر فرم فعلی جزو فرم‌های مجاز نباشد، ارسال آن را متوقف کن - 
            e.preventDefault();
        }
            
            // اعتبارسنجی فرم
            const isValid = validateForm(this);
            
            if (isValid) {
                // نمایش پیام موفقیت
                showToast('فرم با موفقیت ثبت شد', 'success');
                
                // در حالت واقعی اینجا داده‌ها به سرور ارسال می‌شوند
                console.log('Form data:', getFormData(this));
                
                // بازگشت به داشبورد بعد از 2 ثانیه
                setTimeout(() => {
                    window.location.href = '../dashboard/dashboard.html';
                }, 2000);
            }
        });
    });
    
    // اعتبارسنجی فرم
    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.classList.remove('error');
            
            if (!field.value.trim()) {
                field.classList.add('error');
                showToast(`لطفا فیلد ${field.previousElementSibling?.textContent || 'الزامی'} را پر کنید`, 'error');
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // 3. نمایش نوتیفیکیشن
    function showToast(message, type = 'info') {
        // اگر توست از قبل وجود دارد، حذف کن
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // ایجاد عنصر توست
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        // استایل توست
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        // استایل محتوای توست
        const toastContent = toast.querySelector('.toast-content');
        toastContent.style.cssText = `
            display: flex;
            align-items: center;
            flex: 1;
        `;
        
        // آیکون توست
        const toastIcon = toast.querySelector('.toast-content i');
        toastIcon.style.cssText = `
            margin-left: 10px;
            font-size: 1.2rem;
        `;
        
        // دکمه بستن توست
        const toastClose = toast.querySelector('.toast-close');
        toastClose.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1rem;
            margin-right: 5px;
        `;
        
        // انیمیشن
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // اضافه کردن توست به صفحه
        document.body.appendChild(toast);
        
        // بستن توست با کلیک
        toastClose.addEventListener('click', () => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        });
        
        // بستن خودکار توست بعد از 5 ثانیه
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    
    // 4. مدیریت FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            faqItem.classList.toggle('active');
        });
    });
    
    // 5. ایجاد نمودار عملکرد
    const performanceChart = document.getElementById('performanceChart');
    if (performanceChart) {
        createPerformanceChart();
    }
    
    // 6. مدیریت رویدادهای تقویم
    const calendarEvents = document.querySelectorAll('.calendar-event');
    calendarEvents.forEach(event => {
        event.addEventListener('click', function() {
            const eventTitle = this.textContent;
            showToast(`رویداد "${eventTitle}" انتخاب شد`, 'info');
        });
    });
    
    // 7. تنظیمات لوکال استورج برای حالت تاریک/روشن
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // بررسی حالت ذخیره شده
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', this.checked);
        });
    }
    
    // 8. مدیریت حالت تاریک/روشن
    function toggleDarkMode() {
        const body = document.body;
        body.classList.toggle('dark-mode');
        
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // نمایش پیام
        const mode = isDarkMode ? 'تاریک' : 'روشن';
        showToast(`حالت ${mode} فعال شد`, 'info');
    }
    
    // 9. مدیریت فرم جستجو
    function setupSearch() {
        const searchForms = document.querySelectorAll('.search-form');
        
        searchForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const searchInput = this.querySelector('input[type="search"]');
                const searchTerm = searchInput.value.trim();
                
                if (searchTerm) {
                    // انجام جستجو
                    performSearch(searchTerm);
                }
            });
        });
    }

    function performSearch(searchTerm) {
        // در حالت واقعی اینجا درخواست AJAX به سرور ارسال می‌شود
        console.log(`Searching for: ${searchTerm}`);
        showToast(`نتایج جستجو برای "${searchTerm}"`, 'info');
    }
    
    // 10. مدیریت تاریخ‌ها در فرم‌ها
    function setupDatePickers() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        
        dateInputs.forEach(input => {
            // تنظیم حداقل تاریخ به امروز
            const today = new Date().toISOString().split('T')[0];
            input.min = today;
            
            // برای فیلدهای تاریخ پایان، حداقل را برابر تاریخ شروع قرار بده
            if (input.id.includes('end') || input.id.includes('due')) {
                const startInputId = input.id.replace('end', 'start').replace('due', 'start');
                const startInput = document.getElementById(startInputId);
                
                if (startInput) {
                    startInput.addEventListener('change', function() {
                        input.min = this.value;
                    });
                }
            }
        });
    }
    
    // 11. مدیریت انتخاب فایل
    function setupFileUpload() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', function() {
                const fileName = this.files[0]?.name || 'هیچ فایلی انتخاب نشده';
                const fileSize = this.files[0]?.size || 0;
                
                // نمایش اطلاعات فایل
                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';
                fileInfo.innerHTML = `
                    <span>${fileName}</span>
                    <small>(${formatFileSize(fileSize)})</small>
                `;
                
                // حذف اطلاعات قبلی
                const existingInfo = this.nextElementSibling;
                if (existingInfo && existingInfo.classList.contains('file-info')) {
                    existingInfo.remove();
                }
                
                // اضافه کردن اطلاعات جدید
                this.after(fileInfo);
            });
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 بایت';
        
        const k = 1024;
        const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    // 12. مدیریت چاپ صفحات
    const printButtons = document.querySelectorAll('.print-btn');
    printButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            window.print();
        });
    });
    
    // 13. مدیریت دکمه‌های بازگشت
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    });
    
    // راه‌اندازی توابع
    setupSearch();
    setupDatePickers();
    setupFileUpload();

});


// تابع برای تولید شماره دستورکار
function generateWorkOrderNumber() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `WO-${year}-${randomNum}`;
}

// تابع برای محاسبه زمان تخمینی تکمیل
function calculateEstimatedCompletion(startDate, estimatedHours) {
    const start = new Date(startDate);
    const completion = new Date(start.getTime() + (estimatedHours * 60 * 60 * 1000));
    return completion.toLocaleString('fa-IR');
}

// مدیریت وضعیت تجهیزات
const equipmentStatus = {
    NORMAL: 'normal',
    WARNING: 'warning',
    CRITICAL: 'critical',
    MAINTENANCE: 'maintenance'
};

function getEquipmentStatus(lastMaintenanceDate, maintenanceInterval) {
    const lastDate = new Date(lastMaintenanceDate);
    const now = new Date();
    const daysSinceLastMaintenance = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastMaintenance > maintenanceInterval * 1.2) {
        return equipmentStatus.CRITICAL;
    } else if (daysSinceLastMaintenance > maintenanceInterval) {
        return equipmentStatus.WARNING;
    } else if (daysSinceLastMaintenance > maintenanceInterval * 0.8) {
        return equipmentStatus.MAINTENANCE;
    } else {
        return equipmentStatus.NORMAL;
    }
}

// فیلتر کردن جدول‌ها
function filterTable(tableId, searchInputId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    if (!searchInput || !table) return;
    
    searchInput.addEventListener('keyup', function() {
        const filter = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tr');
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let rowContainsFilter = false;
            
            for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.toLowerCase().indexOf(filter) > -1) {
                    rowContainsFilter = true;
                    break;
                }
            }
            
            row.style.display = rowContainsFilter ? '' : 'none';
        }
    });
}

// مرتب‌سازی جدول
function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // تعیین جهت مرتب‌سازی
    const isAscending = table.getAttribute('data-sort-direction') !== 'asc';
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        // بررسی عددی بودن
        const aNum = parseFloat(aValue.replace(/,/g, ''));
        const bNum = parseFloat(bValue.replace(/,/g, ''));
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? aNum - bNum : bNum - aNum;
        } else {
            // مرتب‌سازی متنی
            return isAscending 
                ? aValue.localeCompare(bValue, 'fa')
                : bValue.localeCompare(aValue, 'fa');
        }
    });
    
    // حذف ردیف‌های موجود
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // افزودن ردیف‌های مرتب‌شده
    rows.forEach(row => tbody.appendChild(row));
    
    // ذخیره جهت مرتب‌سازی
    table.setAttribute('data-sort-direction', isAscending ? 'asc' : 'desc');
}

// بارگذاری داده‌های نمونه
function loadSampleData(dataType) {
    // در اینجا می‌توان داده‌های نمونه را از فایل sample-data.js بارگذاری کرد
    console.log(`Loading sample data for: ${dataType}`);
    
    // نمایش پیام
    showToast(`داده‌های نمونه ${dataType} بارگذاری شدند`, 'success');
    
    // رفرش صفحه
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// تابع برای محاسبه شاخص‌های عملکرد
function calculatePerformanceIndicators(workOrders) {
    const total = workOrders.length;
    const completed = workOrders.filter(wo => wo.status === 'completed').length;
    const onTime = workOrders.filter(wo => {
        return wo.status === 'completed' && 
               new Date(wo.completedDate) <= new Date(wo.dueDate);
    }).length;
    
    return {
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        onTimeRate: completed > 0 ? Math.round((onTime / completed) * 100) : 0,
        totalWorkOrders: total,
        completedWorkOrders: completed
    };
}

// تابع برای ایجاد کد QR
function generateQRCode(elementId, text) {
    // در حالت واقعی از کتابخانه QRCode.js استفاده می‌شود
    console.log(`Generating QR code for: ${text}`);
    
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>کد QR برای: ${text.substring(0, 20)}...</p>
            </div>
        `;
    }
}

// تابع برای ارسال گزارش PDF
function generatePDF(reportType, data) {
    console.log(`Generating PDF report for: ${reportType}`);
    showToast(`گزارش ${reportType} در حال تولید است...`, 'info');
    
    // شبیه‌سازی تولید گزارش
    setTimeout(() => {
        showToast(`گزارش ${reportType} با موفقیت تولید شد`, 'success');
        
        // در حالت واقعی اینجا گزارش دانلود می‌شود
        const link = document.createElement('a');
        link.href = '#'; // در حالت واقعی URL فایل PDF
        link.download = `report-${reportType}-${new Date().toISOString().slice(0,10)}.pdf`;
        link.click();
    }, 2000);
}

// مدیریت تایمرهای اتوماتیک
let autoSaveTimer;
function setupAutoSave(formId, interval = 30000) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('input', function() {
        // ریست تایمر
        clearTimeout(autoSaveTimer);
        
        // تنظیم تایمر جدید
        autoSaveTimer = setTimeout(() => {
            autoSaveForm(formId);
        }, interval);
    });
}

function autoSaveForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const formData = getFormData(form);
    
    // ذخیره در localStorage
    localStorage.setItem(`autoSave_${formId}`, JSON.stringify(formData));
    
    // نمایش پیام
    const toast = document.querySelector('.auto-save-toast');
    if (toast) toast.remove();
    
    const autoSaveToast = document.createElement('div');
    autoSaveToast.className = 'auto-save-toast';
    autoSaveToast.textContent = 'ذخیره خودکار انجام شد';
    autoSaveToast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background-color: #2c3e50;
        color: white;
        padding: 8px 15px;
        border-radius: 4px;
        font-size: 0.8rem;
        opacity: 0.9;
        z-index: 9999;
    `;
    
    document.body.appendChild(autoSaveToast);
    
    setTimeout(() => {
        autoSaveToast.remove();
    }, 2000);
}

// تابع برای بازیابی داده‌های ذخیره شده
function restoreAutoSavedData(formId) {
    const savedData = localStorage.getItem(`autoSave_${formId}`);
    if (!savedData) return;
    
    const form = document.getElementById(formId);
    if (!form) return;
    
    const data = JSON.parse(savedData);
    
    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = data[key];
        }
    });
    
    showToast('داده‌های ذخیره شده بازیابی شدند', 'info');
}

// بازیابی داده‌های ذخیره شده برای فرم‌ها
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.id) {
            restoreAutoSavedData(form.id);
            setupAutoSave(form.id);
        }
    });

    //---------- دستورات مسیر صفحه ---------------
    // main.js - تابع displayCurrentPath را با این کد جایگزین کنید:

    // نمایش مسیر کامل صفحه در هدر با لینک‌های قابل کلیک
    function displayCurrentPath() {
        const header = document.querySelector('.header-left');
        if (!header) return;
        
        // حذف عنصر مسیر قبلی اگر وجود دارد
        const existingPath = document.querySelector('.current-path');
        if (existingPath) {
            existingPath.remove();
        }
        
        // مسیر صفحه فعلی
        const currentPath = window.location.pathname;
        const pathSegments = currentPath.split('/').filter(segment => segment && segment !== '../dashboard/dashboard.html');
        
        // لغت‌نامه برای ترجمه نام پوشه‌ها و فایل‌ها
        const dictionary = {
            // پوشه‌ها
            'management': 'مدیریت',
            'forms': 'فرم‌ها',
            'planning': 'برنامه‌ریزی',
            'reports': 'گزارش‌ها',
            'procedures': 'مستندات',
            'data': 'داده‌ها',
            'sidebar': 'منو کناری',
            'css': 'استایل‌ها',
            'js': 'اسکریپت‌ها',
            
            // صفحات اصلی
            'index': 'داشبورد',
            'notifications': 'اعلان‌ها',
            'calendar': 'تقویم',
            'settings': 'تنظیمات',
            'help': 'راهنما',
            
            // زیرصفحات
            'work-orders': 'دستورکارها',
            'equipment': 'تجهیزات',
            'personnel': 'پرسنل',
            'inventory': 'انبار',
            'vendors': 'تأمین‌کنندگان',
            'performance': 'عملکرد',
            'downtime': 'زمان توقف',
            'costs': 'هزینه‌ها',
            'preventive': 'تعمیرات پیشگیرانه',
            'schedule': 'برنامه زمانی',
            'shutdown': 'توقف خط',
            'resources': 'منابع',
            'instructions': 'دستورالعمل‌ها',
            'checklists': 'چک‌لیست‌ها',
            'safety': 'ایمنی',
            'manuals': 'کاتالوگ‌ها',
            
            // فرم‌ها
            'work-request': 'درخواست کار',
            'failure-report': 'گزارش خرابی',
            'preventive-maintenance': 'تعمیرات پیشگیرانه',
            'periodic-inspection': 'بازرسی دوره‌ای',
            'work-completion': 'تکمیل کار',
            'safety-checklist': 'چک‌لیست ایمنی',
            'forms-list': 'لیست فرم‌ها'
        };
        
        // ساخت مسیر کامل با لینک‌ها
        let breadcrumbs = [];
        
        // همیشه "صفحه اصلی" را اول اضافه می‌کنیم
        breadcrumbs.push({
            name: 'صفحه اصلی',
            url: '../dashboard/dashboard.html'
        });
        
        // ساخت لینک‌های میانی
        let accumulatedPath = '';
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            const isLast = i === pathSegments.length - 1;
            const segmentName = segment.replace('.html', '');
            const translatedName = dictionary[segmentName] || segmentName.replace('-', ' ');
            
            accumulatedPath += '/' + segment;
            
            breadcrumbs.push({
                name: translatedName,
                url: isLast ? null : accumulatedPath.replace(/^\//, '') // آخرین بخش لینک ندارد
            });
        }
        
        // اگر در صفحه اصلی هستیم و فقط "صفحه اصلی" داریم، "داشبورد" هم اضافه کنیم
        if (breadcrumbs.length === 1) {
            breadcrumbs.push({
                name: 'داشبورد',
                url: null
            });
        }
        
        // ایجاد عنصر مسیر
        const pathElement = document.createElement('div');
        pathElement.className = 'current-path';
        
        // ساخت HTML برای مسیر
        let pathHTML = '<i class="fas fa-map-marker-alt" style="margin-left: 8px; color: #3498db;"></i>';
        
        breadcrumbs.forEach((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (crumb.url && !isLast) {
                // بخش‌های قبلی: لینک دار
                pathHTML += `<a href="${crumb.url}" class="breadcrumb-link">${crumb.name}</a>`;
            } else {
                // آخرین بخش: بدون لینک
                pathHTML += `<span class="breadcrumb-current">${crumb.name}</span>`;
            }
            
            // اضافه کردن جداکننده (به جز برای آخرین)
            if (!isLast) {
                pathHTML += '<span class="breadcrumb-separator">/</span>';
            }
        });
        
        pathElement.innerHTML = pathHTML;
        
        // اضافه کردن به هدر
        header.appendChild(pathElement);
        
        // اضافه کردن event listener برای لینک‌ها
        pathElement.addEventListener('click', function(e) {
            if (e.target.classList.contains('breadcrumb-link')) {
                // جلوگیری از رفتار پیش‌فرض اگر نیاز دارید
                // e.preventDefault();
                // در اینجا می‌توانید مسیردهی سفارشی انجام دهید
            }
        });
    }
    // فراخوانی تابع نمایش مسیر
    displayCurrentPath();
    //-------------پایان دستورات مسیر صفحه ---------------





// js/main.js - نسخه اصلاح شده
// (فقط بخش اعلان‌های هوشمند را جایگزین کنید)

// --------- شروع کد مدیریت اعلان‌های هوشمند در هدر ----------

const SmartNotificationManager = {
    userId: null,
    userRole: null,
    notifications: [],
    lastCheckTime: null,
    checkInterval: null,
    realTimeEnabled: true,










    
    
    init: function() {
        console.log('🎯 SmartNotificationManager initialization started');
        
        // دریافت اطلاعات کاربر
        this.loadUserInfo();
        
        if (!this.userId) {
            console.error('❌ User ID not available for notifications');
            return;
        }
        
        console.log(`✅ Initialized for user ${this.userId} with role ${this.userRole}`);
        
        // بارگذاری اولیه اعلان‌ها
        this.loadNotifications();
        
        // تنظیم event listeners
        this.setupEventListeners();
        
        // شروع چک کردن اعلان‌های جدید
        this.startPolling();
        
        // ردیابی زمان آخرین چک
        this.lastCheckTime = new Date().toISOString();
        
        console.log('✅ SmartNotificationManager initialization completed');
    },

    // --start-- بستن منوی اعلان‌ها با کلیک بیرون، بروزرسانی هنگام تغییر اندازه صفحه و بررسی اعلان‌های جدید هنگام بازگشت به صفحه
    setupEventListeners: function() {
        console.log('🔔 Setting up notification event listeners...');
        
        // رویداد کلیک روی document برای بستن dropdown
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            const bell = document.getElementById('notificationBell');
            
            if (dropdown && bell && !bell.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // رویداد resize برای تنظیم موقعیت dropdown در موبایل
        window.addEventListener('resize', () => {
            // در صورت نیاز
        });
        
        // رویداد visibilitychange برای بروزرسانی هنگام بازگشت به صفحه
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('📱 Page visible, checking notifications...');
                this.checkForNewNotifications();
            }
        });
        
        console.log('✅ Event listeners setup completed');
    },
    
    // --End-- بستن منوی اعلان‌ها با کلیک بیرون، بروزرسانی هنگام تغییر اندازه صفحه و بررسی اعلان‌های جدید هنگام بازگشت به صفحه


    loadUserInfo: function() {
        console.log('👤 Loading user info for notifications...');
        
        try {
            // روش اول: از Auth object
            if (typeof Auth !== 'undefined' && Auth.getUser) {
                const user = Auth.getUser();
                if (user) {
                    this.userId = user.id || user.user_id || user.userId;
                    this.userRole = user.role || 'operator';
                    console.log('✅ User loaded from Auth:', { userId: this.userId, userRole: this.userRole });
                    return;
                }
            }
            
            // روش دوم: از localStorage مستقیم
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                this.userId = user.id || user.user_id || user.userId || 1;
                this.userRole = user.role || 'operator';
                console.log('✅ User loaded from localStorage:', { userId: this.userId, userRole: this.userRole });
                return;
            }
            
            // اگر هیچ‌کدام کار نکرد، از کاربر پیش‌فرض استفاده کن
            this.userId = 1;
            this.userRole = 'admin';
            console.log('⚠️ Using default user for notifications:', { userId: this.userId, userRole: this.userRole });
            
        } catch (error) {
            console.error('❌ Error loading user info:', error);
            this.userId = 1;
            this.userRole = 'admin';
        }
    },
    
    loadNotifications: function(refreshUI = true) {
        if (!this.userId) {
            console.error('❌ Cannot load notifications: No User ID');
            return;
        }
        
        console.log(`📥 Loading notifications for user ID: ${this.userId}`);
        
        // استفاده از API - فقط اعلان‌های خوانده نشده
        const apiUrl = `../api/notifications.php?user_id=${this.userId}&unread_only=true&limit=10`;
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('📊 API response for unread notifications:', data);
                
                if (data.success) {
                    this.notifications = data.data || [];
                    console.log(`✅ Loaded ${this.notifications.length} unread notifications`);
                    
                    this.lastCheckTime = new Date().toISOString();
                    
                    if (refreshUI) {
                        this.renderBell();
                        this.updateSidebarBadge();
                        // ذخیره تعداد در localStorage برای استفاده در صفحات دیگر
                        localStorage.setItem('unread_notifications_count', data.unread_count || this.notifications.length);
                        localStorage.setItem('unread_notifications_timestamp', Date.now());
                    }
                    
                } else {
                    console.error('❌ API error:', data.error);
                    this.loadSampleNotifications();
                }
            })
            .catch(error => {
                console.error('❌ Fetch error:', error);
                this.loadSampleNotifications();
            });

            
    },
    
    loadSampleNotifications: function() {
        console.log('📋 Loading sample notifications');
        
        // داده‌های نمونه - فقط خوانده نشده‌ها
        this.notifications = [
            {
                id: 1,
                title: "درخواست تعمیر جدید",
                message: "درخواست تعمیر برای دستگاه CNC",
                type: "maintenance_request",
                priority: "high",
                is_read: "0",
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                title: "موجودی قطعه کم شد",
                message: "موجودی بلبرینگ به ۳ عدد رسیده است",
                type: "parts",
                priority: "high",
                is_read: "0",
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
        
        this.renderBell();
        this.updateSidebarBadge();
        localStorage.setItem('unread_notifications_count', this.notifications.length);
        localStorage.setItem('unread_notifications_timestamp', Date.now());
    },
    
    renderBell: function() {
        console.log('🔔 Rendering notification bell...');
        
        const headerRight = document.querySelector('.header-right');
        if (!headerRight) {
            console.error('❌ header-right not found!');
            setTimeout(() => this.renderBell(), 500);
            return;
        }
        
        // حذف زنگوله قبلی
        const existingBell = headerRight.querySelector('.notification-bell-container');
        if (existingBell) {
            existingBell.remove();
        }
        
        const unreadCount = this.getUnreadCount();
        console.log(`🔴 Unread notifications: ${unreadCount}`);
        
        // HTML زنگوله
        const bellHTML = `
            <div class="notification-bell-container">
                <div class="notification-bell" id="notificationBell">
                    <i class="fas fa-bell"></i>
                    ${unreadCount > 0 ? `
                        <span class="notification-badge" id="notificationBadge">
                            ${unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    ` : ''}
                </div>
                <div class="notification-dropdown" id="notificationDropdown">
                    <div class="notification-dropdown-header">
                        <h3>اعلان‌های خوانده نشده</h3>
                        ${unreadCount > 0 ? `
                            <button class="mark-all-read-btn" id="markAllReadBtn">علامت‌گذاری همه</button>
                        ` : ''}
                        <button class="refresh-notifications-btn" id="refreshNotificationsBtn" title="بروزرسانی">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div class="notification-dropdown-content" id="notificationDropdownContent">
                        ${this.renderDropdownItems()}
                    </div>
                    <div class="notification-dropdown-footer">
                        <a href="../dashboard/notifications.html" class="view-all-notifications">
                            <i class="fas fa-list"></i> مشاهده همه اعلان‌ها
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // پیدا کردن محل درج
        const userInfo = headerRight.querySelector('.user-info');
        if (userInfo) {
            userInfo.insertAdjacentHTML('beforebegin', bellHTML);
        } else {
            headerRight.insertAdjacentHTML('afterbegin', bellHTML);
        }
        
        // تنظیم event listeners
        this.setupBellEventListeners();
    },
    
// در main.js - SmartNotificationManager
setupBellEventListeners: function() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    
    if (bell && dropdown) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // بستن dropdownهای دیگر
            document.querySelectorAll('.notification-dropdown.show').forEach(d => {
                d.classList.remove('show');
            });
            
            // نمایش dropdown
            dropdown.classList.toggle('show');
            
            // به‌روزرسانی badge بعد از کلیک (اگر پیام خوانده نشده‌ای باشد)
            this.updateSidebarBadge();
        });
    }
    
    // دکمه علامت‌گذاری همه
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.markAllAsRead();
            
            // به‌روزرسانی اجباری badge
            setTimeout(() => this.forceUpdateBadge(), 1000);
        });
    }
    
    // دکمه بروزرسانی - این مهم است
    const refreshBtn = document.getElementById('refreshNotificationsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🔄 Refresh button clicked, forcing badge update');
            
            // تازه‌سازی اعلان‌ها
            this.loadNotifications();
            
            // به‌روزرسانی اجباری badge
            this.forceUpdateBadge();
            
            // نمایش پیام
            this.showDesktopAlert('اعلان‌ها به‌روزرسانی شدند');
        });
    }
    
    // به‌روزرسانی badge هنگام تغییر صفحه
    window.addEventListener('focus', () => {
        console.log('Page focused, checking notifications');
        this.checkForNewNotifications();
    });
},
    
    renderDropdownItems: function() {
        // فقط اعلان‌های خوانده نشده را نمایش بده
        const unreadNotifications = this.notifications.filter(n => 
            n.is_read == "0" || 
            n.is_read == 0 ||
            n.unread === true
        );
        
        if (unreadNotifications.length === 0) {
            return `
                <div class="no-notifications">
                    <i class="far fa-bell-slash"></i>
                    <p>هیچ اعلان خوانده نشده‌ای ندارید</p>
                </div>
            `;
        }
        
        const itemsToShow = unreadNotifications.slice(0, 5);
        
        return itemsToShow.map(notification => {
            const priorityClass = this.getPriorityClass(notification.priority);
            const timeAgo = this.getTimeAgo(notification.created_at);
            
            return `
                <div class="notification-dropdown-item unread" 
                    data-id="${notification.id}"
                    onclick="window.SmartNotificationManager.handleNotificationClick(event, ${notification.id})">
                    <div class="notification-dropdown-item-icon">
                        <i class="${this.getTypeIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-dropdown-item-content">
                        <div class="notification-dropdown-item-title">
                            ${notification.title || 'بدون عنوان'}
                        </div>
                        <div class="notification-dropdown-item-message">
                            ${notification.message || 'بدون متن'}
                        </div>
                        <div class="notification-dropdown-item-meta">
                            <span class="notification-time">
                                <i class="far fa-clock"></i> ${timeAgo}
                            </span>
                            <span class="notification-priority ${priorityClass}">
                                ${this.getPriorityText(notification.priority)}
                            </span>
                        </div>
                    </div>
                    <button class="notification-mark-read-btn" 
                            onclick="event.stopPropagation(); window.SmartNotificationManager.markAsRead(${notification.id})"
                            title="علامت خوانده شده">
                        <i class="far fa-check-circle"></i>
                    </button>
                </div>
            `;
        }).join('');
    },
    
    handleNotificationClick: function(event, notificationId) {
        event.stopPropagation();
        this.markAsRead(notificationId);
        // باز کردن صفحه مربوطه
        window.location.href = '../dashboard/notifications.html';
    },
    
    getUnreadCount: function() {
        // شمارش فقط اعلان‌های خوانده نشده
        return this.notifications.filter(n => 
            n.is_read == "0" || 
            n.is_read == 0 ||
            n.unread === true
        ).length;
    },
    
// در main.js - تابع updateSidebarBadge را پیدا کرده و به این شکل به‌روزرسانی کنید:
updateSidebarBadge: function() {
    const unreadCount = this.getUnreadCount();
    console.log(`🔄 Updating badge: ${unreadCount} unread`);
    
    // 1. به‌روزرسانی badge در هدر (زنگوله)
    const headerBadge = document.getElementById('notificationBadge');
    if (headerBadge) {
        headerBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        headerBadge.style.display = 'flex';
        
        if (unreadCount === 0) {
            headerBadge.style.backgroundColor = '#95a5a6';
            headerBadge.style.color = 'white';
        } else if (unreadCount <= 5) {
            headerBadge.style.backgroundColor = '#2ecc71';
            headerBadge.style.color = 'white';
        } else if (unreadCount <= 10) {
            headerBadge.style.backgroundColor = '#f39c12';
            headerBadge.style.color = 'white';
        } else {
            headerBadge.style.backgroundColor = '#e74c3c';
            headerBadge.style.color = 'white';
        }
    }
    
    // 2. به‌روزرسانی badge در سایدبار (مهم!)
    const sidebarBadge = document.getElementById('sidebarNotificationBadge');
    if (sidebarBadge) {
        sidebarBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        
        // اضافه کردن استایل‌های مشابه برای سایدبار
        if (unreadCount === 0) {
            sidebarBadge.style.backgroundColor = '#95a5a6';
            sidebarBadge.style.color = 'white';
        } else if (unreadCount <= 5) {
            sidebarBadge.style.backgroundColor = '#2ecc71';
            sidebarBadge.style.color = 'white';
        } else if (unreadCount <= 10) {
            sidebarBadge.style.backgroundColor = '#f39c12';
            sidebarBadge.style.color = 'white';
        } else {
            sidebarBadge.style.backgroundColor = '#e74c3c';
            sidebarBadge.style.color = 'white';
        }
    }
    
    // 3. ذخیره در localStorage
    localStorage.setItem('unread_notifications_count', unreadCount);
    localStorage.setItem('unread_notifications_timestamp', Date.now());
},

forceUpdateBadge: function() {
    console.log('🔴 Force updating notification badge');
    
    // ابتدا داده‌ها را تازه کن
    this.loadNotifications(false);
    
    // سپس badge را به‌روزرسانی کن
    setTimeout(() => {
        this.updateSidebarBadge();
        
        // همچنین badge در header.js را هم به‌روزرسانی کن
        if (window.updateNotificationBadge) {
            const unreadCount = this.getUnreadCount();
            window.updateNotificationBadge(unreadCount);
        }
    }, 500);
},

    
    updateAllHeaderBadges: function(count) {
        // پیدا کردن تمام badgeها در تمام headerها و به‌روزرسانی آنها
        document.querySelectorAll('.notification-badge').forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    },
    
    markAsRead: function(notificationId) {
        if (!this.userId) return;
        
        fetch('../api/notifications.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'mark-read',
                id: notificationId,
                user_id: this.userId,
                timestamp: new Date().toISOString() // ثبت timestamp برای ردگیری
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`✅ Notification ${notificationId} marked as read`);
                this.loadNotifications();
                
                // به‌روزرسانی localStorage
                const currentCount = parseInt(localStorage.getItem('unread_notifications_count') || '0');
                if (currentCount > 0) {
                    localStorage.setItem('unread_notifications_count', currentCount - 1);
                }
            }
        })
        .catch(error => {
            console.error('❌ Error marking as read:', error);
        });
    },
    
    markAllAsRead: function() {
        if (!this.userId) return;
        
        if (!confirm('آیا از علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده اطمینان دارید؟')) {
            return;
        }
        
        fetch('../api/notifications.php?action=mark-all-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: this.userId,
                timestamp: new Date().toISOString()
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ All notifications marked as read');
                this.loadNotifications();
                localStorage.setItem('unread_notifications_count', 0);
            }
        })
        .catch(error => {
            console.error('❌ Error marking all as read:', error);
        });
    },
    
// در main.js - SmartNotificationManager
startPolling: function() {
    // توقف interval قبلی
    if (this.checkInterval) {
        clearInterval(this.checkInterval);
    }
    
    // چک کردن هر 2 دقیقه
    this.checkInterval = setInterval(() => {
        this.checkForNewNotifications();
        
        // به‌روزرسانی badge حتی اگر اعلان جدیدی نباشد
        this.updateSidebarBadge();
    }, 120000); // 2 دقیقه
    
    console.log('⏰ Started polling (every 2 minutes)');
},

checkForNewNotifications: function() {
    if (!this.userId || !this.lastCheckTime) return;
    
    console.log('🔍 Checking for new notifications...');
    
    fetch(`../api/notifications.php?action=check-new&user_id=${this.userId}&last_check=${this.lastCheckTime}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`📊 Notification status: ${data.new_count} new, ${data.total} total`);
                
                // همیشه badge را به‌روزرسانی کن
                this.loadNotifications();
                
                if (data.new_count > 0) {
                    console.log(`🆕 Found ${data.new_count} new notifications`);
                    this.showDesktopAlert(`شما ${data.new_count} اعلان جدید دارید`);
                }
                
                // به‌روزرسانی badge در هر حال
                this.updateSidebarBadge();
            }
        })
        .catch(error => {
            console.error('❌ Error checking for new:', error);
            // حتی در صورت خطا هم badge را به‌روزرسانی کن
            this.updateSidebarBadge();
        });
},
    
    // Helper functions
    getPriorityClass: function(priority) {
        const map = {
            'critical': 'priority-critical',
            'high': 'priority-high',
            'medium': 'priority-medium',
            'low': 'priority-low'
        };
        return map[priority] || 'priority-medium';
    },
    
    getPriorityText: function(priority) {
        const map = {
            'critical': 'بحرانی',
            'high': 'بالا',
            'medium': 'متوسط',
            'low': 'پایین'
        };
        return map[priority] || priority;
    },
    
    getTypeIcon: function(type) {
        const map = {
            'maintenance_request': 'fas fa-tools',
            'work_order': 'fas fa-clipboard-list',
            'inspection': 'fas fa-search',
            'equipment': 'fas fa-cogs',
            'parts': 'fas fa-box',
            'alert': 'fas fa-exclamation-triangle',
            'system': 'fas fa-info-circle'
        };
        return map[type] || 'fas fa-bell';
    },
    
    getTimeAgo: function(timestamp) {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'همین الان';
            if (diffMins < 60) return `${diffMins} دقیقه پیش`;
            if (diffHours < 24) return `${diffHours} ساعت پیش`;
            if (diffDays < 30) return `${diffDays} روز پیش`;
            
            return date.toLocaleDateString('fa-IR');
        } catch {
            return 'نامشخص';
        }
    }
};

// --------- راه‌اندازی سیستم اعلان‌ها ----------

function initializeNotificationSystem() {
    console.log('🚀 Starting notification system...');
    
    // ابتدا badge را از localStorage بارگذاری کن
    const savedBadgeCount = localStorage.getItem('notification_badge_count') || 0;
    console.log(`📊 Saved badge count from localStorage: ${savedBadgeCount}`);
    
    // نمایش اولیه badge
    const initialBadge = document.querySelector('.notification-badge');
    if (initialBadge) {
        initialBadge.textContent = savedBadgeCount > 99 ? '99+' : savedBadgeCount;
        initialBadge.style.display = 'flex';
        console.log('✅ Initial badge displayed');
    }
    
    // ابتدا وضعیت badge را بازیابی کن
    setTimeout(() => {
        if (SmartNotificationManager.restoreBadgeState) {
            SmartNotificationManager.restoreBadgeState();
        }
    }, 500);

    // منتظر بمان تا DOM کاملاً لود شود
    if (document.readyState !== 'loading') {
        startNotifications();
    } else {
        document.addEventListener('DOMContentLoaded', startNotifications);
    }
    
    function startNotifications() {
        console.log('📡 DOM ready, starting notification system...');
        
        // راه‌اندازی SmartNotificationManager
        if (typeof SmartNotificationManager !== 'undefined') {
            window.SmartNotificationManager = SmartNotificationManager;
            
            // کمی تاخیر برای اطمینان از لود شدن هدر
            setTimeout(() => {
                SmartNotificationManager.init();
                
                // بروزرسانی دوره‌ی badge هر 10 ثانیه
                setInterval(() => {
                    if (SmartNotificationManager.updateSidebarBadge) {
                        SmartNotificationManager.updateSidebarBadge();
                    }
                }, 10000);
                
                // تابع برای به‌روزرسانی badge در همه صفحات
                window.updateNotificationBadgeGlobally = function(count) {
                    document.querySelectorAll('.notification-badge').forEach(badge => {
                        if (count > 0) {
                            badge.textContent = count > 99 ? '99+' : count;
                            badge.style.display = 'flex';
                        } else {
                            badge.style.display = 'none';
                        }
                    });
                };
            }, 1000);
        } else {
            console.error('❌ SmartNotificationManager is not defined!');
        }
    }

    
}


// تابع برای به‌روزرسانی badge در همه صفحات
function updateGlobalNotificationBadge() {
    // از localStorage بخوان
    const unreadCount = localStorage.getItem('unread_notifications_count') || 0;
    const lastUpdate = localStorage.getItem('unread_notifications_timestamp') || 0;
    const now = Date.now();
    
    // اگر بیش از 5 دقیقه از آخرین بروزرسانی گذشته، دوباره چک کن
    if (now - lastUpdate > 300000) {
        if (window.SmartNotificationManager && window.SmartNotificationManager.loadNotifications) {
            window.SmartNotificationManager.loadNotifications();
        }
    }
    
    // به‌روزرسانی همه badgeها
    document.querySelectorAll('.notification-badge').forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

// هنگام لود شدن صفحه
document.addEventListener('DOMContentLoaded', function() {
    // بارگذاری اولیه badge
    setTimeout(updateGlobalNotificationBadge, 1000);
    
    // هر 30 ثانیه بروزرسانی کن
    setInterval(updateGlobalNotificationBadge, 30000);
});

// هنگام تغییر صفحه
window.addEventListener('pageshow', updateGlobalNotificationBadge);




// شروع سیستم اعلان‌ها
initializeNotificationSystem();

// --------- پایان کد مدیریت اعلان‌های هوشمند ----------














    // گرفتن داده‌های فرم
    function getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            // اگر کلید تکراری باشد، آرایه بساز
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        });
        
        return data;
    }
    
   













    





    // توابع کمکی برای اعلان‌ها
    function sendMaintenanceRequestNotification(requestData) {
        if (typeof SmartNotificationManager !== 'undefined') {
            // در حالت واقعی، این اطلاعات از سرور دریافت می‌شود
            SmartNotificationManager.triggerGroupNotification(
                'supervisor',
                'درخواست تعمیر جدید',
                `درخواست تعمیر برای ${requestData.equipmentName} ثبت شد`,
                'maintenance_request',
                requestData.priority
            );
        }
    }

    function sendWorkOrderNotification(workOrderData) {
        if (typeof SmartNotificationManager !== 'undefined') {
            SmartNotificationManager.triggerNotification(
                workOrderData.assignedTo,
                'دستورکار جدید',
                `یک دستورکار جدید به شما تخصیص یافت: ${workOrderData.title}`,
                'work_order',
                workOrderData.priority
            );
        }
    }

    // تابع برای تست سیستم اعلان‌ها
    function testNotificationSystem() {
        if (typeof SmartNotificationManager !== 'undefined') {
            console.log('Testing notification system...');
            
            // تست اعلان‌های مختلف
            SmartNotificationManager.triggerNotification(
                SmartNotificationManager.userId,
                'تست سیستم اعلان‌ها',
                'این یک پیام تستی از سیستم اعلان‌های هوشمند است',
                'system',
                'medium'
            );
            
            setTimeout(() => {
                SmartNotificationManager.showDesktopAlert('تست اعلان دسکتاپ', 'info');
            }, 1000);
        }
    }

    // اضافه کردن توابع به scope global برای دسترسی از صفحات دیگر
    window.sendMaintenanceRequestNotification = sendMaintenanceRequestNotification;
    window.sendWorkOrderNotification = sendWorkOrderNotification;
    window.testNotificationSystem = testNotificationSystem;
















});






// تابع برای چک کردن اعلان‌ها هنگام تغییر صفحه
function checkNotificationsOnPageChange() {
    if (window.SmartNotificationManager && window.SmartNotificationManager.updateSidebarBadge) {
        console.log('Page changed, checking notifications...');
        window.SmartNotificationManager.updateSidebarBadge();
    }
}

// چک کردن هنگام تغییر hash (برای SPAها)
window.addEventListener('hashchange', checkNotificationsOnPageChange);

// چک کردن هنگام popstate (برای backward/forward)
window.addEventListener('popstate', checkNotificationsOnPageChange);

// همچنین هنگام بازگشت focus به صفحه
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.SmartNotificationManager) {
        console.log('Page visible, refreshing notifications...');
        window.SmartNotificationManager.loadNotifications(false);
    }
});
// فایل: components/header.js - نسخه کامل با منوی کاربر
function loadHeader(pageTitle = '', breadcrumbData = null) {
    console.log('شروع بارگذاری هدر...');
    
    // بارگذاری هدر
    fetch('../components/pages-header/header.html')
        .then(response => {
            console.log('پاسخ دریافت شد:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            console.log('محتوای HTML دریافت شد');
            const headerContainer = document.getElementById('header-container') || 
                                   document.querySelector('.main-content') || 
                                   document.querySelector('body');
            console.log('headerContainer پیدا شد:', !!headerContainer);
            
            if (headerContainer) {
                // اضافه کردن هدر به ابتدای main-content
                headerContainer.insertAdjacentHTML('afterbegin', html);
                console.log('هدر به DOM اضافه شد');
                
                // تنظیم عنوان صفحه
                if (pageTitle) {
                    const titleElement = document.getElementById('pageTitle');
                    console.log('عنوان صفحه تنظیم شد:', pageTitle);
                    if (titleElement) {
                        titleElement.textContent = pageTitle;
                    }
                }
                
                // تنظیم مسیر صفحه (breadcrumb)
                if (breadcrumbData) {
                    setupBreadcrumb(breadcrumbData);
                } else {
                    // یا از meta tag/body data attribute بخوان
                    const breadcrumbFromMeta = document.querySelector('meta[name="breadcrumb"]')?.getAttribute('content');
                    if (breadcrumbFromMeta) {
                        setupBreadcrumb(parseBreadcrumbFromString(breadcrumbFromMeta));
                    }else {
                        // به صورت خودکار از URL ایجاد کن
                        const autoBreadcrumb = generateBreadcrumbFromPath();
                        setupBreadcrumb(autoBreadcrumb);
                    }
                }
                
                // تنظیم تاریخ
                const currentDate = new Date().toLocaleDateString('fa-IR');
                const dateElement = document.getElementById('currentDate');
                if (dateElement) {
                    dateElement.textContent = currentDate;
                    console.log('تاریخ تنظیم شد:', currentDate);
                }
                
                // بارگذاری اطلاعات کاربر از localStorage
                loadUserInfo();
                
                // تنظیم منوی کاربر
                setupUserMenu();
                
                // تنظیم دکمه خروج (اگر هنوز در هدر وجود دارد)
                const logoutBtn = document.querySelector('.logout-btn');
                if (logoutBtn) {
                    logoutBtn.style.display = 'none'; // مخفی کردن دکمه خروج اصلی
                    logoutBtn.addEventListener('click', function() {
                        if (confirm('آیا از خروج از سیستم اطمینان دارید؟')) {
                            if (typeof Auth !== 'undefined') {
                                Auth.logout();
                            } else {
                                localStorage.clear();
                            }
                            window.location.href = '../login.html';
                        }
                    });
                    console.log('دکمه خروج تنظیم شد (مخفی)');
                }
                
                // تنظیم دکمه منو
                const menuToggle = document.getElementById('menuToggle');
                if (menuToggle) {
                    menuToggle.addEventListener('click', function() {
                        document.body.classList.toggle('sidebar-collapsed');
                    });
                    console.log('دکمه منو تنظیم شد');
                }
                
                // ارسال event برای اطلاع‌رسانی لود شدن هدر
                console.log('ارسال event برای لود شدن هدر');
                const headerLoadedEvent = new CustomEvent('headerLoaded', {
                    detail: { 
                        timestamp: new Date(),
                        headerElement: document.querySelector('.header')
                    }
                });
                document.dispatchEvent(headerLoadedEvent);
                
            } else {
                console.error('headerContainer پیدا نشد!');
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
        });
}



// تابع برای تنظیم منوی کاربر
function setupUserMenu() {
    console.log('Setting up user menu...');
    
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    
    if (userMenuToggle && userDropdownMenu) {
        // رویداد کلیک برای باز/بستن منو
        userMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // بستن تمام منوهای باز دیگر
            document.querySelectorAll('.notification-dropdown.show').forEach(d => {
                d.classList.remove('show');
            });
            
            // نمایش/پنهان کردن منوی کاربر
            userDropdownMenu.classList.toggle('show');
            console.log('User menu toggled');
        });
        
        // بستن منو با کلیک خارج
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.user-info') && 
                !e.target.closest('.user-dropdown-menu')) {
                userDropdownMenu.classList.remove('show');
            }
        });
        
        // بستن با کلید ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                userDropdownMenu.classList.remove('show');
            }
        });
        
        // تنظیم دکمه خروج در منو
        if (logoutBtnDropdown) {
            logoutBtnDropdown.addEventListener('click', function() {
                if (confirm('آیا از خروج از سیستم اطمینان دارید؟')) {
                    if (typeof Auth !== 'undefined') {
                        Auth.logout();
                    } else {
                        localStorage.clear();
                        sessionStorage.clear();
                    }
                    window.location.href = '../login.html';
                }
            });
            console.log('دکمه خروج در منو تنظیم شد');
        }
        
        // لینک‌های منو
        const profileLink = document.querySelector('a[href="../dashboard/profile.html"]');
        const changePasswordLink = document.querySelector('a[href="../dashboard/change-password.html"]');
        
        // بررسی وجود صفحات و تنظیم لینک‌های جایگزین در صورت عدم وجود
        if (profileLink) {
            profileLink.addEventListener('click', function(e) {
                // بررسی وجود صفحه
                fetch(this.href, { method: 'HEAD' })
                    .catch(() => {
                        e.preventDefault();
                        alert('صفحه ویرایش پروفایل در دسترس نیست. به داشبورد هدایت می‌شوید.');
                        window.location.href = '../dashboard/dashboard.html';
                    });
            });
        }
        
        if (changePasswordLink) {
            changePasswordLink.addEventListener('click', function(e) {
                // بررسی وجود صفحه
                fetch(this.href, { method: 'HEAD' })
                    .catch(() => {
                        e.preventDefault();
                        alert('صفحه تغییر رمز عبور در دسترس نیست. به داشبورد هدایت می‌شوید.');
                        window.location.href = '../dashboard/dashboard.html';
                    });
            });
        }
        
        console.log('User menu setup completed');
    } else {
        console.error('User menu elements not found');
    }
}

// تابع برای تنظیم مسیر صفحه (breadcrumb)
function setupBreadcrumb(breadcrumbItems) {
    console.log('تنظیم breadcrumb با داده:', breadcrumbItems);
    
    const breadcrumbContainer = document.getElementById('breadcrumbContainer');
    if (!breadcrumbContainer) {
        console.error('breadcrumbContainer پیدا نشد!');
        return;
    }
    
    // پاک کردن محتوای قبلی
    breadcrumbContainer.innerHTML = '';
    
    // اگر آرایه نبود یا خالی بود
    if (!Array.isArray(breadcrumbItems) || breadcrumbItems.length === 0) {
        breadcrumbContainer.style.display = 'none';
        return;
    }
    
    breadcrumbContainer.style.display = 'flex';
    
    // ایجاد breadcrumb items
    breadcrumbItems.forEach((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        const breadcrumbItem = document.createElement('div');
        breadcrumbItem.className = 'breadcrumb-item';
        
        if (item.link && !isLast) {
            // آیتم قابل کلیک (غیر از آخرین آیتم)
            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = item.text;
            link.title = item.text;
            breadcrumbItem.appendChild(link);
        } else {
            // آخرین آیتم (غیرقابل کلیک)
            const span = document.createElement('span');
            span.textContent = item.text;
            span.className = 'current-page';
            breadcrumbItem.appendChild(span);
        }
        
        breadcrumbContainer.appendChild(breadcrumbItem);
        
        // اضافه کردن جداکننده (به جز برای آخرین آیتم)
        if (!isLast) {
            const separator = document.createElement('div');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '<i class="fas fa-chevron-right"></i>'; // برای RTL
            breadcrumbContainer.appendChild(separator);
        }
    });
    
    console.log('Breadcrumb تنظیم شد');
}

// تابع برای تبدیل رشته breadcrumb به آرایه
function parseBreadcrumbFromString(breadcrumbString) {
    console.log('تبدیل رشته breadcrumb:', breadcrumbString);
    
    if (!breadcrumbString) return [];
    
    try {
        // فرمت: "خانه|/index.html,پنل کاربری|/dashboard.html,تنظیمات"
        const items = breadcrumbString.split(',');
        return items.map(item => {
            const parts = item.trim().split('|');
            if (parts.length === 2) {
                return {
                    text: parts[0].trim(),
                    link: parts[1].trim()
                };
            } else {
                return {
                    text: parts[0].trim(),
                    link: null
                };
            }
        });
    } catch (error) {
        console.error('خطا در پردازش breadcrumb:', error);
        return [];
    }
}

// تابع برای ایجاد breadcrumb به صورت اتوماتیک از URL
function generateBreadcrumbFromPath() {
    console.log('ایجاد breadcrumb از مسیر URL');
    
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part && part !== 'index.html');
    
    // نقشه صفحات به فارسی
    const pageNames = {
        '': 'خانه',
        'index.html': 'خانه',
        'dashboard.html': 'داشبورد',
        'users.html': 'مدیریت کاربران',
        'products.html': 'محصولات',
        'orders.html': 'سفارشات',
        'reports.html': 'گزارشات',
        'settings.html': 'تنظیمات',
        'profile.html': 'پروفایل کاربری',
        'login.html': 'ورود به سیستم',
        'register.html': 'ثبت نام',
        // اضافه کردن صفحات دیگر بر اساس نیاز
    };
    
    const breadcrumbItems = [];
    let currentPath = '';
    
    // اضافه کردن خانه به عنوان اولین آیتم
    breadcrumbItems.push({
        text: 'خانه',
        link: '/index.html'
    });
    
    // پردازش مسیرها
    for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentPath += '/' + part;
        
        const pageName = pageNames[part] || part.replace('.html', '').replace('-', ' ');
        
        // اگر آخرین قسمت است، لینک ندارد
        const isLast = i === pathParts.length - 1;
        
        breadcrumbItems.push({
            text: pageName,
            link: isLast ? null : currentPath
        });
    }
    
    return breadcrumbItems;
}

// تابع برای بارگذاری اطلاعات کاربر
function loadUserInfo() {
    console.log('بارگذاری اطلاعات کاربر...');
    
    let user = null;
    
    // اولویت اول: استفاده از Auth object
    if (typeof Auth !== 'undefined') {
        console.log('Auth object found');
        user = Auth.getUser();
    } 
    // اولویت دوم: localStorage مستقیم
    else {
        console.log('Auth object NOT found, checking localStorage');
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                user = JSON.parse(userData);
                console.log('User data found in localStorage:', user);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        } else {
            console.log('No user data in localStorage');
        }
    }
    
    if (user) {
        console.log('User object loaded:', user);
        updateUserInfo(user);
    } else {
        console.log('No user object found, using default');
        showDefaultUserInfo();
    }
}

// تابع برای به‌روزرسانی اطلاعات کاربر در هدر
function updateUserInfo(user) {
    console.log('updateUserInfo called with user:', user);
    
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const avatarImage = document.getElementById('userAvatarImage');
    const defaultAvatarIcon = document.getElementById('defaultAvatarIcon');
    
    console.log('Elements found:', {
        userNameElement: !!userNameElement,
        userRoleElement: !!userRoleElement,
        avatarImage: !!avatarImage,
        defaultAvatarIcon: !!defaultAvatarIcon
    });
    
    // تنظیم نام کاربر
    if (userNameElement) {
        const displayName = user.fullname || user.username || 'کاربر';
        userNameElement.textContent = displayName;
        console.log('نام کاربر تنظیم شد:', displayName);
    }
    
    // تنظیم نقش کاربر
    if (userRoleElement) {
        const displayRole = user.role || 'کاربر سیستم';
        userRoleElement.textContent = displayRole;
        console.log('نقش کاربر تنظیم شد:', displayRole);
    }
    
    // تنظیم تصویر کاربر
    if (avatarImage && defaultAvatarIcon) {
        const profileImage = user.profile_image || user.profileImage || '';   
        if (profileImage) {
            console.log('کاربر تصویر پروفایل دارد:', profileImage);
            
            // ساخت URL کامل برای تصویر
            const imageUrl = getProfileImageUrl(profileImage);
            console.log('URL تصویر ساخته شد:', imageUrl);
            
            // پنهان کردن آیکون پیش‌فرض
            defaultAvatarIcon.style.display = 'none';
            
            // تنظیم و نمایش تصویر
            avatarImage.src = imageUrl;
            avatarImage.alt = 'تصویر پروفایل کاربر';
            avatarImage.style.display = 'block';
            
            console.log('تصویر تنظیم شد، آیکون مخفی شد');
            
            // مدیریت خطا در بارگذاری تصویر
            avatarImage.onload = function() {
                console.log('تصویر با موفقیت بارگذاری شد');
            };
            
            avatarImage.onerror = function() {
                console.error('خطا در بارگذاری تصویر!');
                console.log('آدرس تصویر:', avatarImage.src);
                
                // در صورت خطا، تصویر را مخفی و آیکون را نمایش بده
                avatarImage.style.display = 'none';
                defaultAvatarIcon.style.display = 'block';
                console.warn('تصویر پروفایل کاربر بارگذاری نشد، نمایش آیکون پیش‌فرض');
            };
            
        } else {
            console.log('کاربر تصویر پروفایل ندارد');
            // مخفی کردن تصویر و نمایش آیکون
            avatarImage.style.display = 'none';
            defaultAvatarIcon.style.display = 'block';
        }
    }
    
    // به‌روزرسانی اطلاعات منوی کشویی
    updateUserDropdownInfo(user);
    
    console.log('تمام اطلاعات کاربر به‌روزرسانی شد');
}

// تابع برای به روزرسانی اطلاعات در منوی کشویی کاربر
function updateUserDropdownInfo(user) {
    console.log('Updating user dropdown info');
    
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const dropdownAvatarImage = document.getElementById('dropdownAvatarImage');
    const dropdownAvatarIcon = document.getElementById('dropdownAvatarIcon');
    
    // تنظیم نام و ایمیل در منو
    if (dropdownUserName) {
        const displayName = user.fullname || user.username || 'کاربر';
        dropdownUserName.textContent = displayName;
        console.log('نام کاربر در منو تنظیم شد:', displayName);
    }
    
    if (dropdownUserEmail) {
        const displayEmail = user.email || user.username + '@example.com' || 'کاربر@example.com';
        dropdownUserEmail.textContent = displayEmail;
        console.log('ایمیل کاربر در منو تنظیم شد:', displayEmail);
    }
    
    // تنظیم تصویر در منو
    if (dropdownAvatarImage && dropdownAvatarIcon) {
        const profileImage = user.profile_image || user.profileImage || '';
        if (profileImage) {
            console.log('تنظیم تصویر پروفایل در منو:', profileImage);
            
            const imageUrl = getProfileImageUrl(profileImage);
            
            // پنهان کردن آیکون پیش‌فرض
            dropdownAvatarIcon.style.display = 'none';
            
            // تنظیم و نمایش تصویر
            dropdownAvatarImage.src = imageUrl;
            dropdownAvatarImage.alt = 'تصویر پروفایل کاربر';
            dropdownAvatarImage.style.display = 'block';
            
            // مدیریت خطا
            dropdownAvatarImage.onload = function() {
                console.log('تصویر منو با موفقیت بارگذاری شد');
            };
            
            dropdownAvatarImage.onerror = function() {
                console.error('خطا در بارگذاری تصویر منو!');
                dropdownAvatarImage.style.display = 'none';
                dropdownAvatarIcon.style.display = 'block';
            };
            
        } else {
            console.log('کاربر تصویر پروفایل ندارد، نمایش آیکون در منو');
            dropdownAvatarImage.style.display = 'none';
            dropdownAvatarIcon.style.display = 'block';
        }
    }
}

// تابع برای نمایش اطلاعات پیش‌فرض کاربر
function showDefaultUserInfo() {
    console.log('نمایش اطلاعات پیش‌فرض کاربر');
    
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const avatarImage = document.getElementById('userAvatarImage');
    const defaultAvatarIcon = document.getElementById('defaultAvatarIcon');
    
    if (userNameElement) {
        userNameElement.textContent = 'کاربر';
    }
    
    if (userRoleElement) {
        userRoleElement.textContent = 'سیستم';
    }
    
    if (avatarImage && defaultAvatarIcon) {
        avatarImage.style.display = 'none';
        defaultAvatarIcon.style.display = 'block';
    }
    
    // اطلاعات پیش‌فرض در منوی کشویی
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const dropdownAvatarImage = document.getElementById('dropdownAvatarImage');
    const dropdownAvatarIcon = document.getElementById('dropdownAvatarIcon');
    
    if (dropdownUserName) {
        dropdownUserName.textContent = 'کاربر';
    }
    
    if (dropdownUserEmail) {
        dropdownUserEmail.textContent = 'کاربر@example.com';
    }
    
    if (dropdownAvatarImage && dropdownAvatarIcon) {
        dropdownAvatarImage.style.display = 'none';
        dropdownAvatarIcon.style.display = 'block';
    }
}

// تابع برای ساخت URL تصویر پروفایل - نسخه بهبود یافته
function getProfileImageUrl(imagePath) {
    console.log('مسیر اصلی تصویر از دیتابیس:', imagePath);
    
    // پاکسازی و trim کردن مسیر
    imagePath = (imagePath || '').trim();
    
    // اگر مسیر خالی است
    if (!imagePath) {
        console.log('مسیر تصویر خالی است');
        return '';
    }
    
    // 1. اگر URL کامل است (با http، https یا // شروع شود)
    if (imagePath.startsWith('http://') || 
        imagePath.startsWith('https://') || 
        imagePath.startsWith('//')) {
        console.log('مسیر کامل تشخیص داده شد');
        return imagePath;
    }
    
    // 2. اگر مسیر مطلق از ریشه سایت است (با / شروع می‌شود)
    if (imagePath.startsWith('/')) {
        console.log('مسیر مطلق تشخیص داده شد');
        // اگر مسیر با images شروع نشده، پیشوند اضافه کن
        if (!imagePath.startsWith('/images/')) {
            return '/images/profiles' + imagePath;
        }
        return imagePath;
    }
    
    // 3. اگر مسیر نسبی است اما شامل پوشه images است
    if (imagePath.includes('images/') || imagePath.includes('profiles/')) {
        console.log('مسیر نسبی با پوشه images تشخیص داده شد');
        // تبدیل به مسیر مطلق
        if (!imagePath.startsWith('/')) {
            return '/' + imagePath;
        }
        return imagePath;
    }
    
    // 4. حالت پیش‌فرض: فقط نام فایل - اضافه کردن مسیر کامل
    console.log('مسیر ساده تشخیص داده شد، اضافه کردن پیشوند');
    return '/images/profiles/' + imagePath;
}

// تابع برای به‌روزرسانی آواتار کاربر (می‌تواند از جای دیگر فراخوانی شود)
function updateUserAvatar() {
    console.log('به‌روزرسانی آواتار کاربر');
    loadUserInfo();
}


// در header.js، تابع بارگذاری اطلاعات کاربر
async function loadUserProfile() {
    try {
        const response = await fetch('../api/get-user-profile.php');
        const result = await response.json();
        
        if (result.success && result.data) {
            const user = result.data;
            
            // نمایش نام کاربر
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = user.fullname || user.username;
            }
            
            // نمایش نقش کاربر (اختیاری)
            const userRoleElement = document.querySelector('.user-role');
            if (userRoleElement && user.role) {
                const roleNames = {
                    'admin': 'مدیر سیستم',
                    'Quality-Manager': 'مدیر کیفیت',
                    'Warehouse-Manager': 'مدیر انبار',
                    'Factory-manager': 'مدیر کارخانه',
                    'supervisor': 'سرپرست',
                    'technician': 'تکنسین',
                    'operator': 'اپراتور'
                };
                userRoleElement.textContent = roleNames[user.role] || user.role;
            }
            
            // نمایش تصویر پروفایل
            const userAvatar = document.querySelector('.user-avatar');
            if (userAvatar) {
                if (user.profile_image && user.profile_image !== '') {
                    // تصویر وجود دارد
                    userAvatar.innerHTML = `<img src="${user.profile_image}" alt="${user.fullname}" 
                        class="user-avatar-img"
                        onerror="this.onerror=null; this.style.display='none'; this.parentElement.querySelector('.fallback-icon').style.display='flex';">`;
                    
                    // اضافه کردن آیکون fallback در صورت خطا
                    if (!userAvatar.querySelector('.fallback-icon')) {
                        const fallbackIcon = document.createElement('i');
                        fallbackIcon.className = 'fas fa-user-circle fallback-icon';
                        fallbackIcon.style.cssText = 'font-size: 40px; color: #94a3b8; display: none;';
                        userAvatar.appendChild(fallbackIcon);
                    }
                } else {
                    // بدون تصویر، آیکون پیش‌فرض
                    userAvatar.innerHTML = `<i class="fas fa-user-circle" style="font-size: 40px; color: #94a3b8;"></i>`;
                }
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}


// فراخوانی تابع هنگام بارگذاری
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    
    console.log('DOMContentLoaded - شروع بارگذاری هدر');
    
    // عنوان صفحه را از meta tag یا data attribute بگیر
    const pageTitle = document.querySelector('meta[name="page-title"]')?.getAttribute('content') || 
                     document.body.dataset.pageTitle || '';
    
    // Breadcrumb را تعیین کن
    let breadcrumbData = null;
    
    // اولویت 1: از data attribute بخوان
    const breadcrumbAttribute = document.body.dataset.breadcrumb;
    if (breadcrumbAttribute) {
        breadcrumbData = parseBreadcrumbFromString(breadcrumbAttribute);
    }
    // اولویت 2: از meta tag بخوان
    else {
        const breadcrumbMeta = document.querySelector('meta[name="breadcrumb"]');
        if (breadcrumbMeta) {
            breadcrumbData = parseBreadcrumbFromString(breadcrumbMeta.getAttribute('content'));
        }
        // اولویت 3: به صورت خودکار از URL ایجاد کن
        else {
            breadcrumbData = generateBreadcrumbFromPath();
        }
    }
    
    console.log('عنوان صفحه:', pageTitle);
    console.log('داده breadcrumb:', breadcrumbData);
    
    loadHeader(pageTitle, breadcrumbData);
});

// تابعی که می‌توان از صفحات دیگر فراخوانی کرد
function refreshHeader() {
    console.log('تازه‌سازی هدر');
    loadUserInfo();
}

// تابع برای به‌روزرسانی breadcrumb از صفحات دیگر
function updateBreadcrumb(breadcrumbItems) {
    setupBreadcrumb(breadcrumbItems);
}

// تابع برای باز کردن منوی کاربر به صورت برنامه‌ای
function openUserMenu() {
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    if (userDropdownMenu) {
        userDropdownMenu.classList.add('show');
        console.log('User menu opened programmatically');
    }
}

// تابع برای بستن منوی کاربر به صورت برنامه‌ای
function closeUserMenu() {
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    if (userDropdownMenu) {
        userDropdownMenu.classList.remove('show');
        console.log('User menu closed programmatically');
    }
}

// تابع برای ویرایش اطلاعات کاربر (فراخوانی از سایر صفحات)
function editUserProfile() {
    // بستن منو
    closeUserMenu();
    
    // هدایت به صفحه ویرایش پروفایل
    window.location.href = '../dashboard/profile.html';
}

// تابع برای تغییر رمز عبور (فراخوانی از سایر صفحات)
function changeUserPassword() {
    // بستن منو
    closeUserMenu();
    
    // هدایت به صفحه تغییر رمز عبور
    window.location.href = '../dashboard/change-password.html';
}

// تابع برای خروج از سیستم (فراخوانی از سایر صفحات)
function logoutUser() {
    if (confirm('آیا از خروج از سیستم اطمینان دارید؟')) {
        if (typeof Auth !== 'undefined') {
            Auth.logout();
        } else {
            localStorage.clear();
            sessionStorage.clear();
        }
        window.location.href = '../login.html';
    }
}

function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        
        // همیشه نمایش داده شود
        badge.style.display = 'flex';
        
        // تغییر رنگ بر اساس تعداد
        if (count === 0) {
            badge.style.backgroundColor = '#95a5a6';
            badge.style.color = 'white';
        } else if (count <= 5) {
            badge.style.backgroundColor = '#2ecc71';
            badge.style.color = 'white';
        } else if (count <= 10) {
            badge.style.backgroundColor = '#f39c12';
            badge.style.color = 'white';
        } else {
            badge.style.backgroundColor = '#e74c3c';
            badge.style.color = 'white';
        }
        
        // ذخیره زمان آخرین به‌روزرسانی
        localStorage.setItem('last_badge_update', new Date().toISOString());
    }
}


// اضافه کردن توابع به scope global برای دسترسی از صفحات دیگر
window.editUserProfile = editUserProfile;
window.changeUserPassword = changeUserPassword;
window.logoutUser = logoutUser;
window.openUserMenu = openUserMenu;
window.closeUserMenu = closeUserMenu;




// تابع برای به‌روزرسانی badge در هدر
function updateHeaderNotificationBadge() {
    const headerBadge = document.querySelector('.notification-badge');
    const sidebarBadge = document.getElementById('sidebarNotificationBadge');
    
    // از localStorage بخوان
    let unreadCount = localStorage.getItem('unread_notifications_count') || 0;
    unreadCount = parseInt(unreadCount);
    
    // به‌روزرسانی هدر
    if (headerBadge) {
        headerBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        headerBadge.style.display = 'flex';
        
        if (unreadCount === 0) {
            headerBadge.style.backgroundColor = '#95a5a6';
        } else if (unreadCount <= 5) {
            headerBadge.style.backgroundColor = '#2ecc71';
        } else if (unreadCount <= 10) {
            headerBadge.style.backgroundColor = '#f39c12';
        } else {
            headerBadge.style.backgroundColor = '#e74c3c';
        }
    }
    
    // به‌روزرسانی سایدبار
    if (sidebarBadge) {
        sidebarBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        
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
}



// هنگام لود شدن هدر، badge را به‌روزرسانی کن
document.addEventListener('headerLoaded', updateHeaderNotificationBadge);

// هر 10 ثانیه badge را چک کن
setInterval(updateHeaderNotificationBadge, 10000);

// اضافه کردن تابع به global scope
window.updateHeaderNotificationBadge = updateHeaderNotificationBadge;

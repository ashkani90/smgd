// js/auth.js
const Auth = {
    // بررسی وضعیت لاگین
    isLoggedIn: function() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!user || !token) return false;
        
        try {
            const userData = JSON.parse(user);
            // می‌توانید اعتبار توکن را با سرور بررسی کنید
            return userData.loggedIn === true;
        } catch(e) {
            return false;
        }
    },
    
    // دریافت اطلاعات کاربر
    getUser: function() {
        const user = localStorage.getItem('user');
        if (!user) return null;
        
        try {
            return JSON.parse(user);
        } catch(e) {
            return null;
        }
    },
    
    // دریافت دسترسی‌های کاربر
    getPermissions: function() {
        const permissions = localStorage.getItem('permissions');
        if (!permissions) return [];
        
        try {
            return JSON.parse(permissions);
        } catch(e) {
            return [];
        }
    },
    
    // بررسی دسترسی
    hasPermission: function(requiredPermission) {
        const permissions = this.getPermissions();
        const user = this.getUser();
        
        // اگر کاربر admin باشد، همه دسترسی‌ها را دارد
        if (user && user.role === 'admin') return true;
        
        return permissions.includes(requiredPermission);
    },
    
    // لاگین
    login: function(userData, token, permissions, rememberToken = null) {
        localStorage.setItem('user', JSON.stringify({
            ...userData,
            loggedIn: true,
            loginTime: new Date().toISOString()
        }));
        
        localStorage.setItem('token', token);
        localStorage.setItem('permissions', JSON.stringify(permissions));
        
        if (rememberToken) {
            localStorage.setItem('remember_token', rememberToken);
        }
        
        // ثبت در کوکی برای session management
        document.cookie = `session_active=true; path=/; max-age=${60 * 60 * 24}`; // 24 ساعت
    },
    
    // لاگ‌اوت
    logout: function() {
        // ارسال درخواست به سرور برای باطل کردن توکن
        fetch('api/logout.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        }).catch(console.error);
        
        // پاک‌سازی localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('permissions');
        localStorage.removeItem('remember_token');
        
        // پاک‌سازی کوکی‌ها
        document.cookie = "session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    },
    
    // ریدایرکت اگر لاگین نباشد
    requireAuth: function(redirectUrl = 'login.html') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },
    
    // بررسی نقش
    hasRole: function(requiredRole) {
        const user = this.getUser();
        if (!user) return false;
        
        if (user.role === 'admin') return true;
        
        return user.role === requiredRole;
    },
    
    // اعتبارسنجی توکن با سرور
    validateToken: async function() {
        try {
            const response = await fetch('api/validate_token.php', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            
            const data = await response.json();
            return data.valid === true;
        } catch(error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
};
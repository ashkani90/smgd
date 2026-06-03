راهنمای استفاده از هدر

کدهای هدر را در قسمت زیر پاک کنید 
--------------------------------------

<main class="main-content">
    <!-- هدر به صورت خودکار لود می‌شود بنابراین کدهای زیر را حذف کند -->

--------------- شروع کدی که باید حذف شود --------------
        <!-- هدر -->
        <header class="header">
            <div class="header-left">
                <button class="menu-toggle" id="menuToggle">
                    <i class="fas fa-bars"></i>
                </button>
                <h1>داشبورد سیستم نگهداری و تعمیرات</h1>
            </div>
            <div class="header-right">
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-details">
                        <span class="user-name">علیرضا محمدی</span>
                        <span class="user-role">سرپرست تعمیرات</span>
                    </div>
                    <button class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
                <div class="date-display">
                    <i class="fas fa-calendar"></i>
                    <span id="currentDate">...</span>
                </div>
            </div>
        </header>
--------------- پایان کدی که باید حذف شود --------------
    
    <!-- محتوای صفحه -->
    <div class="dashboard-grid">
        ...
    </div>
</main>

---------------------------------------
در بیرون بدنه main کد زیر را قرار دهید

<!-- عنوان هدر صفحه -->
<meta name="page-title" content="عنوان هدر خود را بنویسید">

----------------------------------------

قبل از بسته شدن بدنه </body> اسکریپت هدر را فراخوانی کنید

    <!-- اسکریپت هدر -->
    <script src="../components/pages-header/header.js"></script>

مسیری که فایل JS قرار دارد را بنویسید
----------------------------------------


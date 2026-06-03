// print-utilities.js

// تابع کمکی برای تبدیل دسته‌بندی به متن فارسی
function getCategoryText(category) {
    const categories = {
        'safety': 'ایمنی',
        'operation': 'عملیاتی',
        'maintenance': 'نگهداری',
        'calibration': 'کالیبراسیون',
        'inspection': 'بازرسی',
        'quality': 'کیفیت',
        'emergency': 'اضطراری'
    };
    return categories[category] || category;
}

// تابع کمکی برای تبدیل واحد به متن فارسی
function getDepartmentText(department) {
    const departments = {
        'production': 'تولید',
        'maintenance': 'تعمیرات',
        'quality': 'کنترل کیفیت',
        'safety': 'ایمنی و بهداشت',
        'engineering': 'مهندسی',
        'warehouse': 'انبار'
    };
    return departments[department] || department;
}

// تابع کمکی برای تبدیل وضعیت به متن فارسی
function getStatusText(status) {
    const statuses = {
        'active': 'فعال',
        'draft': 'پیش‌نویس',
        'inactive': 'غیرفعال'
    };
    return statuses[status] || status;
}

// تابع اصلی چاپ لیست دستورالعمل‌ها
function printInstructionsList(instructionsData, pageTitle = 'لیست دستورالعمل‌های اجرایی') {
    if (!instructionsData || !Array.isArray(instructionsData)) {
        console.error('داده‌های نامعتبر برای چاپ');
        return false;
    }
    
    // محاسبه آمار
    const totalCount = instructionsData.length;
    const activeCount = instructionsData.filter(inst => inst.status === 'active').length;
    const draftCount = instructionsData.filter(inst => inst.status === 'draft').length;
    const inactiveCount = instructionsData.filter(inst => inst.status === 'inactive').length;
    
    // تاریخ فعلی
    const now = new Date();
    const year = now.getFullYear() - 621;
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const currentDate = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    
    // ایجاد HTML برای چاپ
    const printHTML = generatePrintHTML({
        title: pageTitle,
        currentDate: currentDate,
        totalCount: totalCount,
        activeCount: activeCount,
        draftCount: draftCount,
        inactiveCount: inactiveCount,
        instructions: instructionsData,
        printDate: now.toLocaleDateString('fa-IR')
    });
    
    // باز کردن پنجره چاپ
    return openPrintWindow(printHTML, pageTitle);
}

// تولید HTML برای چاپ
function generatePrintHTML(data) {
    return `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${data.title}</title>
            <style>
                ${getPrintStyles()}
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="print-controls">
                <h3>پیش‌نمایش چاپ</h3>
                <p>صفحه را بررسی کرده و سپس دکمه چاپ را کلیک کنید.</p>
                <div class="button-group">
                    <button onclick="window.print()" class="print-btn">
                        <i class="fas fa-print"></i> چاپ لیست
                    </button>
                    <button onclick="window.close()" class="close-btn">
                        <i class="fas fa-times"></i> بستن پنجره
                    </button>
                </div>
            </div>
            
            <div class="header">
                <h1>${data.title}</h1>
                <p>تاریخ گزارش: ${data.currentDate}</p>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <h3>${data.totalCount}</h3>
                    <p>تعداد کل</p>
                </div>
                <div class="stat-item">
                    <h3>${data.activeCount}</h3>
                    <p>فعال</p>
                </div>
                <div class="stat-item">
                    <h3>${data.draftCount}</h3>
                    <p>پیش‌نویس</p>
                </div>
                <div class="stat-item">
                    <h3>${data.inactiveCount}</h3>
                    <p>غیرفعال</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>ردیف</th>
                        <th>کد دستورالعمل</th>
                        <th>عنوان</th>
                        <th>دسته‌بندی</th>
                        <th>واحد مربوطه</th>
                        <th>وضعیت</th>
                        <th>نسخه</th>
                        <th>تاریخ بروزرسانی</th>
                        <th>ایجاد کننده</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.instructions.map((inst, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${inst.code || ''}</td>
                            <td>${inst.title || ''}</td>
                            <td>${getCategoryText(inst.category)}</td>
                            <td>${getDepartmentText(inst.department)}</td>
                            <td>${getStatusText(inst.status)}</td>
                            <td>${inst.version || '1.0'}</td>
                            <td>${inst.updatedDate || data.currentDate}</td>
                            <td>${inst.createdBy || 'سیستم'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>سیستم جامع نگهداری و تعمیرات (CMMS) - چاپ در تاریخ: ${data.printDate}</p>
                <p>تعداد کل رکوردها: ${data.totalCount} رکورد</p>
                <p>محمــد پورســان دلیــر - ۱۴۰۴</p>
            </div>
        </body>
        </html>
    `;
}

// استایل‌های چاپ
function getPrintStyles() {
    return `
        body {
            font-family: 'Vazirmatn', Tahoma, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            background-color: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1a73e8;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #1a73e8;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            flex-wrap: wrap;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        .stat-item {
            text-align: center;
            padding: 10px 15px;
            min-width: 120px;
        }
        .stat-item h3 {
            font-size: 28px;
            margin: 0;
            color: #1a73e8;
        }
        .stat-item p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
        }
        th {
            background-color: #f2f2f2;
            padding: 12px 8px;
            text-align: right;
            border: 1px solid #ddd;
            font-weight: 600;
        }
        td {
            padding: 10px 8px;
            border: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        .print-controls {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #f5f7fa;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .print-controls h3 {
            margin-top: 0;
            color: #1a73e8;
        }
        .button-group {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .print-controls button {
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Vazirmatn', sans-serif;
            font-size: 14px;
            transition: background-color 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .print-btn {
            background-color: #1a73e8;
        }
        .print-btn:hover {
            background-color: #0d62d9;
        }
        .close-btn {
            background-color: #6c757d;
        }
        .close-btn:hover {
            background-color: #5a6268;
        }
        @media print {
            body {
                padding: 0;
            }
            .print-controls {
                display: none;
            }
            .stats {
                background-color: transparent;
                border: 1px solid #ddd;
            }
        }
        @media (max-width: 768px) {
            .stats {
                flex-direction: column;
                align-items: center;
            }
            table {
                font-size: 12px;
            }
            th, td {
                padding: 8px 5px;
            }
        }
    `;
}

// باز کردن پنجره چاپ
function openPrintWindow(htmlContent, title) {
    try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('پنجره جدید باز نشد. ممکن است popup blocker فعال باشد.');
        }
        
        printWindow.document.write(htmlContent);
        printWindow.document.title = title;
        printWindow.document.close();
        
        // تمرکز روی پنجره چاپ
        setTimeout(() => {
            printWindow.focus();
        }, 100);
        
        return printWindow;
    } catch (error) {
        console.error('خطا در ایجاد پنجره چاپ:', error);
        return null;
    }
}

// تابع چاپ تک‌تک دستورالعمل
function printSingleInstruction(instruction) {
    // کد چاپ تک دستورالعمل...
}

// صادر کردن توابع
if (typeof window !== 'undefined') {
    window.printUtilities = {
        printInstructionsList,
        printSingleInstruction,
        getCategoryText,
        getDepartmentText,
        getStatusText
    };
}
// مدیریت گزارش زمان توقف

document.addEventListener('DOMContentLoaded', function() {
    // داده‌های نمونه برای گزارش زمان توقف
    const downtimeData = {
        records: [
            {
                id: "DT-2023-001",
                equipmentId: "EQ-002",
                equipmentName: "دستگاه برش CNC",
                department: "تولید",
                startDate: "1402/05/10 08:30",
                endDate: "1402/05/10 14:00",
                duration: 5.5,
                downtimeType: "unplanned",
                priority: "high",
                rootCause: "mechanical",
                description: "خرابی سیستم هیدرولیک و نیاز به تعویض پمپ",
                cost: 45000000,
                affectedProduction: 1250,
                workOrderId: "WO-2023-045",
                technician: "محمد رضایی",
                status: "resolved"
            },
            {
                id: "DT-2023-002",
                equipmentId: "EQ-001",
                equipmentName: "کمپرسور اصلی",
                department: "تاسیسات",
                startDate: "1402/05/08 10:15",
                endDate: "1402/05/08 13:45",
                duration: 3.5,
                downtimeType: "maintenance",
                priority: "medium",
                rootCause: "preventive",
                description: "تعویض فیلترهای هوا و روغن طبق برنامه PM",
                cost: 18000000,
                affectedProduction: 0,
                workOrderId: "WO-2023-044",
                technician: "علیرضا محمدی",
                status: "resolved"
            },
            {
                id: "DT-2023-003",
                equipmentId: "EQ-003",
                equipmentName: "دیگ بخار",
                department: "تاسیسات",
                startDate: "1402/05/05 14:00",
                endDate: "1402/05/06 09:30",
                duration: 19.5,
                downtimeType: "breakdown",
                priority: "critical",
                rootCause: "electrical",
                description: "سوختن کنترلر اصلی و نیاز به تعمیرات اساسی",
                cost: 85000000,
                affectedProduction: 3200,
                workOrderId: "WO-2023-042",
                technician: "فاطمه احمدی",
                status: "resolved"
            },
            {
                id: "DT-2023-004",
                equipmentId: "EQ-004",
                equipmentName: "سیستم خنک‌کننده",
                department: "تاسیسات",
                startDate: "1402/05/03 11:20",
                endDate: "1402/05/03 16:40",
                duration: 5.3,
                downtimeType: "unplanned",
                priority: "high",
                rootCause: "mechanical",
                description: "نشت مایع خنک‌کننده و نیاز به تعمیر لوله‌کشی",
                cost: 32000000,
                affectedProduction: 850,
                workOrderId: "WO-2023-041",
                technician: "حسن کریمی",
                status: "resolved"
            },
            {
                id: "DT-2023-005",
                equipmentId: "EQ-005",
                equipmentName: "خط تولید ۱",
                department: "تولید",
                startDate: "1402/05/01 08:00",
                endDate: "1402/05/01 12:15",
                duration: 4.25,
                downtimeType: "planned",
                priority: "low",
                rootCause: "calibration",
                description: "کالیبراسیون دورهای سنسورهای خط تولید",
                cost: 15000000,
                affectedProduction: 0,
                workOrderId: "WO-2023-040",
                technician: "تیم کنترل کیفیت",
                status: "resolved"
            },
            {
                id: "DT-2023-006",
                equipmentId: "EQ-002",
                equipmentName: "دستگاه برش CNC",
                department: "تولید",
                startDate: "1402/04/28 09:45",
                endDate: "1402/04/28 11:30",
                duration: 1.75,
                downtimeType: "unplanned",
                priority: "medium",
                rootCause: "human_error",
                description: "خطای اپراتور در تنظیم پارامترهای برش",
                cost: 12000000,
                affectedProduction: 420,
                workOrderId: "WO-2023-039",
                technician: "محمد رضایی",
                status: "resolved"
            },
            {
                id: "DT-2023-007",
                equipmentId: "EQ-006",
                equipmentName: "خط تولید ۲",
                department: "تولید",
                startDate: "1402/04/25 13:00",
                endDate: "1402/04/26 08:00",
                duration: 19,
                downtimeType: "breakdown",
                priority: "critical",
                rootCause: "material_defect",
                description: "خرابی موتور اصلی به دلیل عیب در سیم‌پیچ",
                cost: 95000000,
                affectedProduction: 3800,
                workOrderId: "WO-2023-038",
                technician: "علیرضا محمدی",
                status: "resolved"
            },
            {
                id: "DT-2023-008",
                equipmentId: "EQ-001",
                equipmentName: "کمپرسور اصلی",
                department: "تاسیسات",
                startDate: "1402/04/22 15:30",
                endDate: "1402/04/22 17:45",
                duration: 2.25,
                downtimeType: "unplanned",
                priority: "high",
                rootCause: "mechanical",
                description: "تعویض کوپلینگ خراب",
                cost: 22000000,
                affectedProduction: 650,
                workOrderId: "WO-2023-037",
                technician: "فاطمه احمدی",
                status: "resolved"
            },
            {
                id: "DT-2023-009",
                equipmentId: "EQ-003",
                equipmentName: "دیگ بخار",
                department: "تاسیسات",
                startDate: "1402/04/20 08:00",
                endDate: "1402/04/20 10:30",
                duration: 2.5,
                downtimeType: "maintenance",
                priority: "medium",
                rootCause: "wear_and_tear",
                description: "تعویض شیرهای اطمینان طبق برنامه تعمیرات",
                cost: 18000000,
                affectedProduction: 0,
                workOrderId: "WO-2023-036",
                technician: "حسن کریمی",
                status: "resolved"
            },
            {
                id: "DT-2023-010",
                equipmentId: "EQ-004",
                equipmentName: "سیستم خنک‌کننده",
                department: "تاسیسات",
                startDate: "1402/04/18 11:00",
                endDate: "1402/04/18 14:20",
                duration: 3.33,
                downtimeType: "unplanned",
                priority: "high",
                rootCause: "electrical",
                description: "عیب در سیستم کنترل دما",
                cost: 28000000,
                affectedProduction: 720,
                workOrderId: "WO-2023-035",
                technician: "محمد رضایی",
                status: "resolved"
            }
        ],
        
        // آمار تجمعی
        summary: {
            totalDowntime: 42.5,
            affectedEquipment: 6,
            totalCost: 380000000,
            availabilityRate: 96.8,
            avgRepairTime: 3.2,
            plannedDowntime: 8.25,
            unplannedDowntime: 34.25,
            topEquipment: [
                { name: "دستگاه برش CNC", downtime: 12.5, cost: 57000000 },
                { name: "کمپرسور اصلی", downtime: 8.2, cost: 40000000 },
                { name: "دیگ بخار", downtime: 6.8, cost: 103000000 },
                { name: "سیستم خنک‌کننده", downtime: 5.1, cost: 60000000 },
                { name: "خط تولید ۲", downtime: 4.2, cost: 95000000 }
            ],
            
            // توزیع بر اساس نوع
            byType: {
                planned: { count: 2, duration: 8.25, percentage: 19.4 },
                unplanned: { count: 5, duration: 18.08, percentage: 42.5 },
                maintenance: { count: 2, duration: 6, percentage: 14.1 },
                breakdown: { count: 2, duration: 10.17, percentage: 23.9 }
            },
            
            // توزیع بر اساس علت
            byCause: {
                mechanical: { count: 4, duration: 14.58, percentage: 34.3 },
                electrical: { count: 2, duration: 22.83, percentage: 53.7 },
                human_error: { count: 1, duration: 1.75, percentage: 4.1 },
                preventive: { count: 1, duration: 3.5, percentage: 8.2 },
                calibration: { count: 1, duration: 4.25, percentage: 10.0 },
                material_defect: { count: 1, duration: 19, percentage: 44.7 }
            },
            
            // روند ماهانه
            monthlyTrend: [
                { month: "فروردین", planned: 12.5, unplanned: 18.2, total: 30.7 },
                { month: "اردیبهشت", planned: 10.8, unplanned: 22.4, total: 33.2 },
                { month: "خرداد", planned: 8.25, unplanned: 34.25, total: 42.5 },
                { month: "تیر", planned: 9.0, unplanned: 20.0, total: 29.0 },
                { month: "مرداد", planned: 11.2, unplanned: 15.8, total: 27.0 },
                { month: "شهریور", planned: 7.5, unplanned: 12.3, total: 19.8 }
            ]
        }
    };
    
    // تنظیمات اولیه
    initializePage();
    
    // تابع‌های اصلی
    function initializePage() {
        setupDateRangePicker();
        setupEventListeners();
        loadSummaryStats();
        initializeCharts();
        loadTableData();
        setupTabs();
        setupTablePagination();
    }
    
    // تنظیم انتخاب کننده بازه زمانی
    function setupDateRangePicker() {
        const dateRangeInput = document.getElementById('dateRange');
        
        if (dateRangeInput) {
            flatpickr(dateRangeInput, {
                mode: "range",
                locale: "fa",
                dateFormat: "Y/m/d",
                defaultDate: ["1402/05/01", "1402/05/30"],
                onChange: function(selectedDates, dateStr, instance) {
                    if (selectedDates.length === 2) {
                        console.log('Selected date range:', dateStr);
                    }
                }
            });
        }
    }
    
    // تنظیم رویدادها
    function setupEventListeners() {
        // اعمال فیلترها
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', applyFilters);
        }
        
        // بازنشانی فیلترها
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', resetFilters);
        }
        
        // خروجی گزارش
        const exportReportBtn = document.getElementById('exportReport');
        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', exportReport);
        }
        
        // چاپ جدول
        const printTableBtn = document.getElementById('printTable');
        if (printTableBtn) {
            printTableBtn.addEventListener('click', printTable);
        }
        
        // خروجی اکسل
        const exportTableBtn = document.getElementById('exportTable');
        if (exportTableBtn) {
            exportTableBtn.addEventListener('click', exportTableToExcel);
        }
        
        // مرتب‌سازی جدول
        const sortButtons = document.querySelectorAll('.sort-btn');
        sortButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const column = this.dataset.column;
                sortTable(column);
            });
        });
        
        // مدال جزئیات
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        
        const closeModalIcon = document.getElementById('closeModal');
        if (closeModalIcon) {
            closeModalIcon.addEventListener('click', closeModal);
        }
        
        // بستن مدال با کلیک بیرون
        const modal = document.getElementById('downtimeDetailModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        }
    }
    
    // بارگذاری آمار خلاصه
    function loadSummaryStats() {
        const summary = downtimeData.summary;
        
        document.getElementById('totalDowntime').textContent = summary.totalDowntime;
        document.getElementById('affectedEquipment').textContent = summary.affectedEquipment;
        document.getElementById('totalCost').textContent = Math.round(summary.totalCost / 1000000);
        document.getElementById('availabilityRate').textContent = summary.availabilityRate + '%';
        document.getElementById('avgRepairTime').textContent = summary.avgRepairTime;
    }
    
    // ایجاد نمودارها
    function initializeCharts() {
        createDistributionChart();
        createTrendChart();
        createDowntimeByTypeChart();
        createTotalTrendChart();
        createPlannedVsUnplannedChart();
        createParetoChart();
        createCauseByEquipmentChart();
    }
    
    // نمودار توزیع زمان توقف
    function createDistributionChart() {
        const ctx = document.getElementById('downtimeDistributionChart');
        if (!ctx) return;
        
        const topEquipment = downtimeData.summary.topEquipment;
        const labels = topEquipment.map(item => item.name);
        const data = topEquipment.map(item => item.downtime);
        const colors = [
            'rgba(231, 76, 60, 0.7)',
            'rgba(230, 126, 34, 0.7)',
            'rgba(241, 196, 15, 0.7)',
            'rgba(52, 152, 219, 0.7)',
            'rgba(155, 89, 182, 0.7)'
        ];
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'left',
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} ساعت (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // نمودار روند زمانی
    function createTrendChart() {
        const ctx = document.getElementById('downtimeTrendChart');
        if (!ctx) return;
        
        const monthlyData = downtimeData.summary.monthlyTrend.slice(-6); // ۶ ماه آخر
        const labels = monthlyData.map(item => item.month);
        const plannedData = monthlyData.map(item => item.planned);
        const unplannedData = monthlyData.map(item => item.unplanned);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'برنامه‌ریزی شده',
                        data: plannedData,
                        borderColor: 'rgba(46, 204, 113, 1)',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'غیرمنتظره',
                        data: unplannedData,
                        borderColor: 'rgba(231, 76, 60, 1)',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            },
                            callback: function(value) {
                                return value + ' ساعت';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // نمودار توقف بر اساس نوع
    function createDowntimeByTypeChart() {
        const ctx = document.getElementById('downtimeByTypeChart');
        if (!ctx) return;
        
        const typeData = downtimeData.summary.byType;
        const labels = ['برنامه‌ریزی شده', 'غیرمنتظره', 'تعمیرات', 'خرابی'];
        const data = [
            typeData.planned.duration,
            typeData.unplanned.duration,
            typeData.maintenance.duration,
            typeData.breakdown.duration
        ];
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'زمان توقف (ساعت)',
                    data: data,
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(241, 196, 15, 0.7)'
                    ],
                    borderColor: [
                        'rgba(46, 204, 113, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(52, 152, 219, 1)',
                        'rgba(241, 196, 15, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            },
                            callback: function(value) {
                                return value + ' ساعت';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // نمودار روند کل
    function createTotalTrendChart() {
        const ctx = document.getElementById('totalTrendChart');
        if (!ctx) return;
        
        const monthlyData = downtimeData.summary.monthlyTrend;
        const labels = monthlyData.map(item => item.month);
        const totalData = monthlyData.map(item => item.total);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'زمان توقف کل',
                    data: totalData,
                    borderColor: 'rgba(155, 89, 182, 1)',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            },
                            callback: function(value) {
                                return value + ' ساعت';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // نمودار برنامه‌ریزی شده در مقابل غیرمنتظره
    function createPlannedVsUnplannedChart() {
        const ctx = document.getElementById('plannedVsUnplannedChart');
        if (!ctx) return;
        
        const monthlyData = downtimeData.summary.monthlyTrend;
        const labels = monthlyData.map(item => item.month);
        const plannedData = monthlyData.map(item => item.planned);
        const unplannedData = monthlyData.map(item => item.unplanned);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'برنامه‌ریزی شده',
                        data: plannedData,
                        backgroundColor: 'rgba(46, 204, 113, 0.7)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'غیرمنتظره',
                        data: unplannedData,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            },
                            callback: function(value) {
                                return value + ' ساعت';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // نمودار پارتو
    function createParetoChart() {
        const ctx = document.getElementById('paretoChart');
        if (!ctx) return;
        
        const causes = downtimeData.summary.byCause;
        const labels = ['مکانیکی', 'الکتریکی', 'خطای انسانی', 'پیشگیرانه', 'کالیبراسیون', 'عیب مواد'];
        const frequency = [4, 2, 1, 1, 1, 1];
        
        // محاسبه تجمعی
        let cumulative = 0;
        const cumulativeData = frequency.map((value, index) => {
            cumulative += value;
            return (cumulative / frequency.reduce((a, b) => a + b, 0)) * 100;
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'تعداد وقوع',
                        data: frequency,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'درصد تجمعی',
                        data: cumulativeData,
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
    
    // نمودار علل بر اساس تجهیز
    function createCauseByEquipmentChart() {
        const ctx = document.getElementById('causeByEquipmentChart');
        if (!ctx) return;
        
        // داده‌های نمونه
        const equipmentData = {
            'دستگاه برش CNC': { mechanical: 3, electrical: 1, human_error: 1 },
            'کمپرسور اصلی': { mechanical: 2, preventive: 1 },
            'دیگ بخار': { electrical: 2, wear_and_tear: 1 },
            'سیستم خنک‌کننده': { mechanical: 1, electrical: 1 }
        };
        
        const equipmentNames = Object.keys(equipmentData);
        const causes = ['مکانیکی', 'الکتریکی', 'خطای انسانی', 'پیشگیرانه', 'فرسودگی'];
        
        // ایجاد داده‌های برای نمودار
        const datasets = causes.map((cause, index) => {
            const color = `rgba(${50 + index * 40}, ${100 + index * 30}, ${150 + index * 20}, 0.7)`;
            
            return {
                label: cause,
                data: equipmentNames.map(equipment => {
                    const causeKey = getCauseKey(cause);
                    return equipmentData[equipment][causeKey] || 0;
                }),
                backgroundColor: color,
                borderColor: color.replace('0.7', '1'),
                borderWidth: 1
            };
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: equipmentNames,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            }
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Vazirmatn'
                            },
                            callback: function(value) {
                                return value + ' مورد';
                            }
                        }
                    }
                }
            }
        });
        
        function getCauseKey(cause) {
            const mapping = {
                'مکانیکی': 'mechanical',
                'الکتریکی': 'electrical',
                'خطای انسانی': 'human_error',
                'پیشگیرانه': 'preventive',
                'فرسودگی': 'wear_and_tear'
            };
            return mapping[cause] || cause;
        }
    }
    
    // بارگذاری داده‌های جدول
    function loadTableData(filteredData = null) {
        const tableBody = document.querySelector('#downtimeTable tbody');
        if (!tableBody) return;
        
        // پاک کردن ردیف‌های موجود
        tableBody.innerHTML = '';
        
        const data = filteredData || downtimeData.records;
        
        // محاسبه مجموع
        let totalDuration = 0;
        let totalCost = 0;
        
        data.forEach((record, index) => {
            totalDuration += record.duration;
            totalCost += record.cost;
            
            const row = document.createElement('tr');
            row.dataset.id = record.id;
            
            // تعیین کلاس بر اساس نوع توقف
            let typeClass = '';
            let typeText = '';
            switch(record.downtimeType) {
                case 'planned':
                    typeClass = 'type-planned';
                    typeText = 'برنامه‌ریزی شده';
                    break;
                case 'unplanned':
                    typeClass = 'type-unplanned';
                    typeText = 'غیرمنتظره';
                    break;
                case 'maintenance':
                    typeClass = 'type-maintenance';
                    typeText = 'تعمیرات';
                    break;
                case 'breakdown':
                    typeClass = 'type-breakdown';
                    typeText = 'خرابی';
                    break;
            }
            
            row.innerHTML = `
                <td>${record.equipmentName}</td>
                <td>${record.startDate}</td>
                <td>${record.endDate}</td>
                <td>${record.duration.toFixed(2)}</td>
                <td><span class="downtime-type-badge ${typeClass}">${typeText}</span></td>
                <td>${getRootCauseText(record.rootCause)}</td>
                <td>${Math.round(record.cost / 1000000)}</td>
                <td>
                    <button class="btn-action view-details" data-id="${record.id}" title="مشاهده جزئیات">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit-record" data-id="${record.id}" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // به‌روزرسانی مجموع
        document.getElementById('totalDuration').textContent = totalDuration.toFixed(2);
        document.getElementById('totalTableCost').textContent = Math.round(totalCost / 1000000);
        
        // اضافه کردن رویداد به دکمه‌های عملیات
        const viewButtons = document.querySelectorAll('.view-details');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const recordId = this.dataset.id;
                showDowntimeDetails(recordId);
            });
        });
        
        const editButtons = document.querySelectorAll('.edit-record');
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const recordId = this.dataset.id;
                editDowntimeRecord(recordId);
            });
        });
        
        // کلیک روی ردیف
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.addEventListener('click', function(e) {
                if (!e.target.closest('button')) {
                    const recordId = this.dataset.id;
                    showDowntimeDetails(recordId);
                }
            });
        });
    }
    
    // نمایش جزئیات توقف
    function showDowntimeDetails(recordId) {
        const record = downtimeData.records.find(r => r.id === recordId);
        if (!record) return;
        
        const modalBody = document.querySelector('#downtimeDetailModal .modal-body');
        if (!modalBody) return;
        
        let typeText = '';
        switch(record.downtimeType) {
            case 'planned': typeText = 'برنامه‌ریزی شده'; break;
            case 'unplanned': typeText = 'غیرمنتظره'; break;
            case 'maintenance': typeText = 'تعمیرات'; break;
            case 'breakdown': typeText = 'خرابی'; break;
        }
        
        let priorityText = '';
        switch(record.priority) {
            case 'low': priorityText = 'کم'; break;
            case 'medium': priorityText = 'متوسط'; break;
            case 'high': priorityText = 'بالا'; break;
            case 'critical': priorityText = 'بحرانی'; break;
        }
        
        modalBody.innerHTML = `
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> اطلاعات کلی</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>تجهیز:</label>
                        <span>${record.equipmentName} (${record.equipmentId})</span>
                    </div>
                    <div class="detail-item">
                        <label>دپارتمان:</label>
                        <span>${record.department}</span>
                    </div>
                    <div class="detail-item">
                        <label>شماره دستورکار:</label>
                        <span>${record.workOrderId}</span>
                    </div>
                    <div class="detail-item">
                        <label>تکنسین مسئول:</label>
                        <span>${record.technician}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-clock"></i> زمان‌بندی</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>شروع توقف:</label>
                        <span>${record.startDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>پایان توقف:</label>
                        <span>${record.endDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>مدت توقف:</label>
                        <span>${record.duration} ساعت</span>
                    </div>
                    <div class="detail-item">
                        <label>وضعیت:</label>
                        <span class="status-resolved">${record.status === 'resolved' ? 'رفع شده' : 'در حال بررسی'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-chart-bar"></i> طبقه‌بندی</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>نوع توقف:</label>
                        <span>${typeText}</span>
                    </div>
                    <div class="detail-item">
                        <label>اولویت:</label>
                        <span>${priorityText}</span>
                    </div>
                    <div class="detail-item">
                        <label>علت اصلی:</label>
                        <span>${getRootCauseText(record.rootCause)}</span>
                    </div>
                    <div class="detail-item">
                        <label>تأثیر بر تولید:</label>
                        <span>${record.affectedProduction.toLocaleString()} واحد</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-money-bill-wave"></i> هزینه‌ها</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>هزینه مستقیم:</label>
                        <span>${(record.cost / 1000000).toLocaleString()} میلیون ریال</span>
                    </div>
                    <div class="detail-item">
                        <label>هزینه از دست‌رفته تولید:</label>
                        <span>${(record.affectedProduction * 25000).toLocaleString()} ریال</span>
                    </div>
                    <div class="detail-item">
                        <label>هزینه کل:</label>
                        <span class="total-cost">${((record.cost + (record.affectedProduction * 25000)) / 1000000).toFixed(2)} میلیون ریال</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-file-alt"></i> شرح مشکل</h4>
                <div class="problem-description">
                    <p>${record.description}</p>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-clipboard-check"></i> اقدامات انجام شده</h4>
                <div class="actions-taken">
                    <ul>
                        <li>عیب‌یابی و تشخیص مشکل</li>
                        <li>درخواست قطعات یدکی مورد نیاز</li>
                        <li>انجام تعمیرات لازم</li>
                        <li>تست عملکرد پس از تعمیر</li>
                        <li>برگشت به خط تولید</li>
                    </ul>
                </div>
            </div>
        `;
        
        // نمایش مدال
        document.getElementById('downtimeDetailModal').classList.add('active');
        
        // تنظیم دکمه‌های مدال
        const editBtn = document.getElementById('editDowntimeBtn');
        const deleteBtn = document.getElementById('deleteDowntimeBtn');
        
        if (editBtn) {
            editBtn.onclick = () => editDowntimeRecord(recordId);
        }
        
        if (deleteBtn) {
            deleteBtn.onclick = () => deleteDowntimeRecord(recordId);
        }
    }
    
    // بستن مدال
    function closeModal() {
        document.getElementById('downtimeDetailModal').classList.remove('active');
    }
    
    // ویرایش رکورد توقف
    function editDowntimeRecord(recordId) {
        showToast('ویرایش رکورد در دست توسعه است', 'info');
        closeModal();
    }
    
    // حذف رکورد توقف
    function deleteDowntimeRecord(recordId) {
        if (confirm('آیا از حذف این رکورد اطمینان دارید؟ این عمل قابل بازگشت نیست.')) {
            // در حالت واقعی اینجا درخواست DELETE به سرور ارسال می‌شود
            const index = downtimeData.records.findIndex(r => r.id === recordId);
            if (index !== -1) {
                downtimeData.records.splice(index, 1);
                loadTableData();
                closeModal();
                showToast('رکورد با موفقیت حذف شد', 'success');
            }
        }
    }
    
    // اعمال فیلترها
    function applyFilters() {
        const equipmentFilter = document.getElementById('equipmentFilter');
        const departmentFilter = document.getElementById('departmentFilter');
        const downtimeTypeFilter = document.getElementById('downtimeTypeFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        const minDowntime = document.getElementById('minDowntime');
        const costThreshold = document.getElementById('costThreshold');
        const rootCauseFilter = document.getElementById('rootCauseFilter');
        
        let filteredData = downtimeData.records;
        
        // فیلتر تجهیز
        const selectedEquipment = Array.from(equipmentFilter.selectedOptions).map(option => option.value);
        if (!selectedEquipment.includes('all')) {
            filteredData = filteredData.filter(record => 
                selectedEquipment.includes(record.equipmentId)
            );
        }
        
        // فیلتر دپارتمان
        if (departmentFilter.value !== 'all') {
            filteredData = filteredData.filter(record => 
                record.department === getDepartmentText(departmentFilter.value)
            );
        }
        
        // فیلتر نوع توقف
        if (downtimeTypeFilter.value !== 'all') {
            filteredData = filteredData.filter(record => 
                record.downtimeType === downtimeTypeFilter.value
            );
        }
        
        // فیلتر اولویت
        if (priorityFilter.value !== 'all') {
            filteredData = filteredData.filter(record => 
                record.priority === priorityFilter.value
            );
        }
        
        // فیلتر حداقل زمان توقف
        if (minDowntime.value) {
            filteredData = filteredData.filter(record => 
                record.duration >= parseFloat(minDowntime.value)
            );
        }
        
        // فیلتر آستانه هزینه
        if (costThreshold.value) {
            filteredData = filteredData.filter(record => 
                (record.cost / 1000000) >= parseFloat(costThreshold.value)
            );
        }
        
        // فیلتر علت اصلی
        if (rootCauseFilter.value !== 'all') {
            filteredData = filteredData.filter(record => 
                record.rootCause === rootCauseFilter.value
            );
        }
        
        // بارگذاری داده‌های فیلتر شده
        loadTableData(filteredData);
        
        // به‌روزرسانی آمار خلاصه
        updateSummaryStats(filteredData);
        
        showToast(`فیلترها اعمال شدند. ${filteredData.length} رکورد یافت شد.`, 'success');
    }
    
    // بازنشانی فیلترها
    function resetFilters() {
        document.getElementById('equipmentFilter').value = 'all';
        document.getElementById('departmentFilter').value = 'all';
        document.getElementById('downtimeTypeFilter').value = 'all';
        document.getElementById('priorityFilter').value = 'all';
        document.getElementById('minDowntime').value = '';
        document.getElementById('costThreshold').value = '';
        document.getElementById('rootCauseFilter').value = 'all';
        
        loadTableData();
        loadSummaryStats();
        
        showToast('فیلترها بازنشانی شدند', 'info');
    }
    
    // به‌روزرسانی آمار خلاصه بر اساس داده‌های فیلتر شده
    function updateSummaryStats(filteredData) {
        if (!filteredData || filteredData.length === 0) {
            document.getElementById('totalDowntime').textContent = '۰';
            document.getElementById('affectedEquipment').textContent = '۰';
            document.getElementById('totalCost').textContent = '۰';
            return;
        }
        
        const totalDuration = filteredData.reduce((sum, record) => sum + record.duration, 0);
        const totalCost = filteredData.reduce((sum, record) => sum + record.cost, 0);
        const uniqueEquipment = new Set(filteredData.map(record => record.equipmentId));
        
        document.getElementById('totalDowntime').textContent = totalDuration.toFixed(1);
        document.getElementById('affectedEquipment').textContent = uniqueEquipment.size;
        document.getElementById('totalCost').textContent = Math.round(totalCost / 1000000);
    }
    
    // خروجی گزارش
    function exportReport() {
        showToast('در حال تولید گزارش PDF...', 'info');
        
        // شبیه‌سازی تولید گزارش
        setTimeout(() => {
            showToast('گزارش با موفقیت تولید شد و در حال دانلود است', 'success');
            
            // ایجاد لینک دانلود مجازی
            const link = document.createElement('a');
            link.href = '#';
            link.download = `downtime-report-${new Date().toISOString().slice(0,10)}.pdf`;
            link.click();
        }, 1500);
    }
    
    // چاپ جدول
    function printTable() {
        window.print();
    }
    
    // خروجی اکسل
    function exportTableToExcel() {
        showToast('در حال تولید فایل اکسل...', 'info');
        
        // در حالت واقعی از کتابخانه‌هایی مانند SheetJS استفاده می‌شود
        setTimeout(() => {
            showToast('فایل اکسل با موفقیت تولید شد', 'success');
            
            const link = document.createElement('a');
            link.href = '#';
            link.download = `downtime-data-${new Date().toISOString().slice(0,10)}.xlsx`;
            link.click();
        }, 1000);
    }
    
    // مرتب‌سازی جدول
    function sortTable(column) {
        const tbody = document.querySelector('#downtimeTable tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const sortBtn = document.querySelector(`.sort-btn[data-column="${column}"]`);
        
        // تعیین جهت مرتب‌سازی
        const isAscending = !sortBtn.classList.contains('asc');
        
        // حذف کلاس‌های مرتب‌سازی از تمام دکمه‌ها
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('asc', 'desc');
        });
        
        // اضافه کردن کلاس جهت به دکمه فعلی
        if (isAscending) {
            sortBtn.classList.add('asc');
        } else {
            sortBtn.classList.add('desc');
        }
        
        // مرتب‌سازی ردیف‌ها
        rows.sort((a, b) => {
            const aValue = getCellValue(a, column);
            const bValue = getCellValue(b, column);
            
            if (column === 'duration' || column === 'cost') {
                // مرتب‌سازی عددی
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
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
    }
    
    // گرفتن مقدار سلول
    function getCellValue(row, column) {
        const cellIndex = getColumnIndex(column);
        const cell = row.cells[cellIndex];
        
        if (column === 'duration' || column === 'cost') {
            return parseFloat(cell.textContent);
        }
        
        return cell.textContent.trim();
    }
    
    // گرفتن ایندکس ستون
    function getColumnIndex(column) {
        const mapping = {
            'equipment': 0,
            'startDate': 1,
            'endDate': 2,
            'duration': 3,
            'type': 4,
            'cause': 5,
            'cost': 6
        };
        
        return mapping[column] || 0;
    }
    
    // تنظیم تب‌ها
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // حذف کلاس active از همه تب‌ها
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // اضافه کردن کلاس active به تب انتخاب شده
                this.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    
    // تنظیم صفحه‌بندی جدول
    function setupTablePagination() {
        // پیاده‌سازی صفحه‌بندی در نسخه واقعی کامل‌تر خواهد بود
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', function() {
                const pageSize = parseInt(this.value);
                console.log('Page size changed to:', pageSize);
                // در اینجا منطق صفحه‌بندی پیاده‌سازی می‌شود
            });
        }
    }
    
    // تابع‌های کمکی
    function getRootCauseText(rootCause) {
        const mapping = {
            'mechanical': 'مکانیکی',
            'electrical': 'الکتریکی',
            'human_error': 'خطای انسانی',
            'material_defect': 'عیب مواد اولیه',
            'wear_and_tear': 'فرسودگی طبیعی',
            'preventive': 'تعمیرات پیشگیرانه',
            'calibration': 'کالیبراسیون'
        };
        
        return mapping[rootCause] || rootCause;
    }
    
    function getDepartmentText(departmentKey) {
        const mapping = {
            'production': 'تولید',
            'packaging': 'بسته‌بندی',
            'facilities': 'تاسیسات',
            'quality': 'کنترل کیفی'
        };
        
        return mapping[departmentKey] || departmentKey;
    }
    
    // نمایش پیام
    function showToast(message, type = 'info') {
        // استفاده از تابع showToast تعریف شده در main.js
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // پیاده‌سازی ساده اگر تابع موجود نباشد
            alert(message);
        }
    }
});

// در دسترس قرار دادن توابع برای استفاده در سایر قسمت‌ها
window.downtimeReports = {
    applyFilters: function() {
        // اعمال فیلترها
    },
    exportReport: function() {
        // خروجی گزارش
    },
    showDetails: function(recordId) {
        // نمایش جزئیات
    }
};
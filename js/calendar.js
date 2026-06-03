// در فایل calendar.js، کل کد را با این نسخه اصلاح شده جایگزین کنید

document.addEventListener('DOMContentLoaded', function() {
    // بارگذاری تقویم FullCalendar با داده‌های واقعی
    var calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('عنصر تقویم پیدا نشد!');
        return;
    }

    // تعریف calendar در scope بالاتر
    window.calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'fa',
        direction: 'rtl',
        initialView: 'dayGridMonth',
        headerToolbar: {
            right: 'prev,today,next',
            center: 'title',
            left: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
        },
        buttonText: {
            today: 'امروز',
            month: 'ماه',
            week: 'هفته',
            day: 'روز',
            list: 'لیست'
        },
        
        events: function(fetchInfo, successCallback, failureCallback) {
            const year = fetchInfo.start.getFullYear();
            const month = fetchInfo.start.getMonth() + 1;
            
            fetch(`../api/get_calendar_events.php?month=${month}&year=${year}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        successCallback(data.events);
                    } else {
                        console.error('خطا از سرور:', data.message);
                        successCallback([]);
                    }
                })
                .catch(error => {
                    console.error('خطا در دریافت رویدادها:', error);
                    failureCallback(error);
                });
        },

        eventClick: function(info) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let eventDate;
            if (info.event.start) {
                eventDate = new Date(info.event.start);
                eventDate.setHours(0, 0, 0, 0);
            } else {
                eventDate = today;
            }
            
            const isPastEvent = eventDate < today;
            
            if (isPastEvent) {
                const eventDetails = 
                    `📅 عنوان: ${info.event.title}\n` +
                    `📝 شرح: ${info.event.extendedProps.description || 'ندارد'}\n` +
                    `📆 تاریخ شروع: ${new Date(info.event.start).toLocaleDateString('fa-IR')}\n` +
                    `🔖 نوع: ${getEventTypePersian(info.event.extendedProps.type)}\n` +
                    `📍 محل: ${info.event.extendedProps.location || 'نامشخص'}\n\n` +
                    `⚠️ وضعیت: این رویداد مربوط به گذشته است و قابل ویرایش نمی‌باشد.`;
                
                alert(eventDetails);
            } else {
                const eventDetails = 
                    `📅 عنوان: ${info.event.title}\n` +
                    `📝 شرح: ${info.event.extendedProps.description || 'ندارد'}\n` +
                    `📆 تاریخ شروع: ${new Date(info.event.start).toLocaleDateString('fa-IR')}\n` +
                    `🔖 نوع: ${getEventTypePersian(info.event.extendedProps.type)}\n` +
                    `📍 محل: ${info.event.extendedProps.location || 'نامشخص'}\n` +
                    `___________________________________________________________________________\n` +
                    `📢 آیا می‌خواهید این رویداد را ویرایش کنید؟`;
                
                if (confirm(eventDetails)) {
                    openEditEventModal(info.event);
                }
            }
        },
        
        eventContent: function(arg) {
            return {
                html: `<div style="padding: 2px; font-size: 0.8rem; border-radius: 3px; background-color: ${arg.event.backgroundColor || '#3498db'}; color: white;">
                    ${arg.event.title}
                </div>`
            };
        },
        
        dateClick: function(info) {
            window.openEventModal(info.dateStr);
        }
    });

    // تابع کمکی برای ترجمه نوع رویداد به فارسی
    function getEventTypePersian(type) {
        const types = {
            'work_order': 'دستورکار',
            'maintenance': 'تعمیرات پیشگیرانه',
            'inspection': 'بازرسی',
            'meeting': 'جلسه',
            'training': 'آموزش',
            'shutdown': 'توقف خط',
            'holiday': 'تعطیلات',
            'other': 'سایر'
        };
        return types[type] || type || 'نامشخص';
    }
    
    // تابع باز کردن مودال ویرایش
    window.openEditEventModal = function(event) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let eventDate;
        if (event.start) {
            eventDate = new Date(event.start);
            eventDate.setHours(0, 0, 0, 0);
        }
        
        if (eventDate && eventDate < today) {
            alert('این رویداد مربوط به گذشته است و قابل ویرایش نمی‌باشد.');
            return;
        }

        const modal = document.getElementById('eventModal');
        const deleteBtn = document.getElementById('deleteEventBtn');
        if (!modal) return;
        
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.setAttribute('data-event-id', event.id);
        }
        
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventType').value = event.extendedProps.type || 'other';
        
        if (event.start) {
            const startDate = new Date(event.start);
            if (typeof event.start === 'string') {
                const startParts = event.start.split('T');
                document.getElementById('startDate').value = startParts[0];
                if (startParts.length > 1 && !event.allDay) {
                    document.getElementById('startTime').value = startParts[1].substring(0, 5);
                } else {
                    document.getElementById('startTime').value = '';
                }
            } else {
                document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
                if (!event.allDay) {
                    const hours = String(startDate.getHours()).padStart(2, '0');
                    const minutes = String(startDate.getMinutes()).padStart(2, '0');
                    document.getElementById('startTime').value = `${hours}:${minutes}`;
                } else {
                    document.getElementById('startTime').value = '';
                }
            }
        }
        
        if (event.end) {
            if (typeof event.end === 'string') {
                const endParts = event.end.split('T');
                document.getElementById('endDate').value = endParts[0];
                if (endParts.length > 1 && !event.allDay) {
                    document.getElementById('endTime').value = endParts[1].substring(0, 5);
                } else {
                    document.getElementById('endTime').value = '';
                }
            } else {
                const endDate = new Date(event.end);
                document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
                if (!event.allDay) {
                    const hours = String(endDate.getHours()).padStart(2, '0');
                    const minutes = String(endDate.getMinutes()).padStart(2, '0');
                    document.getElementById('endTime').value = `${hours}:${minutes}`;
                } else {
                    document.getElementById('endTime').value = '';
                }
            }
        } else {
            document.getElementById('endDate').value = '';
            document.getElementById('endTime').value = '';
        }
        
        document.getElementById('allDay').checked = event.allDay || false;
        document.getElementById('eventPriority').value = event.extendedProps.priority || 'medium';
        document.getElementById('eventLocation').value = event.extendedProps.location || '';
        document.getElementById('eventDescription').value = event.extendedProps.description || '';
        document.getElementById('eventColor').value = event.backgroundColor || '#3788d8';
        
        modal.style.display = 'flex';
    }

    // تابع باز کردن مودال افزودن
    window.openEventModal = function(date = null) {
        const modal = document.getElementById('eventModal');
        const deleteBtn = document.getElementById('deleteEventBtn');
        if (!modal) return;
        
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
        
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        
        if (date) {
            document.getElementById('startDate').value = date;
        } else {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('startDate').value = today;
        }
        
        modal.style.display = 'flex';
    }

    // تابع حذف رویداد
    window.deleteEvent = function() {
        const eventId = document.getElementById('eventId').value;
        if (!eventId) return;
        
        if (!confirm('آیا از حذف این رویداد اطمینان دارید؟')) {
            return;
        }
        
        fetch('../api/delete_calendar_event.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: eventId })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('رویداد با موفقیت حذف شد');
                closeEventModal();
                window.calendar.refetchEvents();
            } else {
                alert('خطا: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('خطا در ارتباط با سرور');
        });
    }

    // تابع ذخیره رویداد
    window.saveEvent = function() {
        const form = document.getElementById('eventForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => data[key] = value);
        
        if (!data.start_date) {
            alert('لطفاً تاریخ شروع را انتخاب کنید');
            return;
        }
        
        const eventId = document.getElementById('eventId').value;
        const isEditMode = eventId && eventId !== '';
        
        let url, method;
        if (isEditMode) {
            url = '../api/update_calendar_event.php';
            method = 'PUT';
            data.id = eventId;
        } else {
            url = '../api/add_calendar_event.php';
            method = 'POST';
        }
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(isEditMode ? 'رویداد با موفقیت ویرایش شد' : 'رویداد با موفقیت ثبت شد');
                closeEventModal();
                if (window.calendar) {
                    window.calendar.refetchEvents();
                }
            } else {
                alert('خطا: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('خطا در ارتباط با سرور');
        });
    };

    window.closeEventModal = function() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        const deleteBtn = document.getElementById('deleteEventBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
            deleteBtn.removeAttribute('data-event-id');
        }
        
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
    }

    // رندر تقویم
    window.calendar.render();
    console.log('تقویم با موفقیت بارگذاری شد');

    // پر کردن سال‌ها
    populateGregorianYears();
    
    // دکمه برو
    const goDateBtn = document.getElementById('goDate');
    if (goDateBtn) {
        goDateBtn.addEventListener('click', function() {
            const yearSelectGregorian = document.getElementById('yearSelectGregorian');
            const monthSelectGregorian = document.getElementById('monthSelectGregorian');
            
            if (window.calendar && yearSelectGregorian && monthSelectGregorian) {
                const year = parseInt(yearSelectGregorian.value);
                const month = parseInt(monthSelectGregorian.value);
                window.calendar.gotoDate(new Date(year, month - 1, 1));
                window.calendar.refetchEvents();
            }
        });
    }

    // دکمه افزودن رویداد جدید
    const addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', function() {
            window.openEventModal();
        });
    }

    // دکمه چاپ
    const printBtn = document.getElementById('printCalendar');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            printCalendar();
        });
    }

    // فیلتر رویدادها
    const eventFilter = document.getElementById('eventFilter');
    if (eventFilter && window.calendar) {
        eventFilter.addEventListener('change', function() {
            const filterValue = this.value;
            const allEvents = window.calendar.getEvents();
            
            allEvents.forEach(event => {
                if (filterValue === 'all') {
                    event.setProp('display', 'auto');
                } else {
                    const eventType = event.extendedProps.type;
                    
                    let typeToShow = '';
                    switch(filterValue) {
                        case 'workorder':
                            typeToShow = 'work_order';
                            break;
                        case 'preventive':
                            typeToShow = 'maintenance';
                            break;
                        case 'inspection':
                            typeToShow = 'inspection';
                            break;
                        case 'shutdown':
                            typeToShow = 'shutdown';
                            break;
                        default:
                            typeToShow = '';
                    }
                    
                    if (eventType === typeToShow) {
                        event.setProp('display', 'auto');
                    } else {
                        event.setProp('display', 'none');
                    }
                }
            });
        });
    }

    // بارگذاری رویدادهای امروز
    loadTodayEvents();

    // پر کردن سال‌های میلادی
    function populateGregorianYears() {
        const yearSelectGregorian = document.getElementById('yearSelectGregorian');
        if (!yearSelectGregorian) return;
        
        const currentYear = new Date().getFullYear();
        yearSelectGregorian.innerHTML = '';
        
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelectGregorian.appendChild(option);
        }
        
        yearSelectGregorian.value = currentYear;
        
        // تنظیم ماه فعلی
        const monthSelectGregorian = document.getElementById('monthSelectGregorian');
        if (monthSelectGregorian) {
            monthSelectGregorian.value = new Date().getMonth() + 1;
        }
    }

    // تابع برای بارگذاری رویدادهای امروز
    async function loadTodayEvents() {
        try {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            
            const response = await fetch(`../api/get_calendar_events.php?month=${month}&year=${year}`);
            const data = await response.json();
            
            if (data.success) {
                const todayEvents = data.events.filter(event => {
                    const eventDate = event.start.split('T')[0];
                    const todayStr = today.toISOString().split('T')[0];
                    return eventDate === todayStr;
                });
                
                renderTodayEvents(todayEvents);
            }
        } catch (error) {
            console.error('خطا در دریافت رویدادهای امروز:', error);
        }
    }

    function renderTodayEvents(events) {
        const container = document.getElementById('todayEventsList');
        if (!container) return;
        
        if (events.length === 0) {
            container.innerHTML = '<p class="no-events" style="color: #666; text-align: center; padding: 20px;">رویدادی برای امروز وجود ندارد</p>';
            return;
        }
        
        container.innerHTML = events.map(event => `
            <div class="event-item ${event.type}" style="margin-bottom: 10px;">
                <div class="event-title" style="font-weight: bold; color: #2c3e50;">${event.title}</div>
                <div class="event-time" style="color: #666; font-size: 0.9rem;">
                    <i class="far fa-clock" style="margin-left: 5px;"></i>
                    ${event.allDay ? 'تمام روز' : (event.start.split('T')[1] || 'ساعت نامشخص')}
                </div>
            </div>
        `).join('');
    }
});














// تابع چاپ تقویم (نسخه اصلاح شده - بدون باز شدن صفحه جدید)
function printCalendar() {
    // بررسی وجود تقویم
    if (!window.calendar) {
        console.error('تقویم آماده نیست');
        alert('لطفاً چند لحظه صبر کنید و مجدداً تلاش کنید');
        return;
    }
    
    // دریافت داده‌های رویدادها از تقویم
    const events = window.calendar.getEvents();
    const currentDate = window.calendar.getDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // دریافت عنوان ماه و سال
    const monthNames = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 
                        'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
    const monthName = monthNames[currentMonth - 1];
    
    // ایجاد محتوای HTML برای چاپ
    const printContent = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>چاپ تقویم - ${monthName} ${currentYear}</title>
            <style>
                @media print {
                    body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; margin: 20px; }
                    .print-header { text-align: center; margin-bottom: 30px; }
                    .print-header h1 { color: #2c3e50; margin-bottom: 5px; }
                    .print-header .date { color: #7f8c8d; font-size: 16px; }
                    .calendar-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .calendar-table th { background-color: #3498db; color: white; padding: 10px; text-align: center; }
                    .calendar-table td { border: 1px solid #ddd; padding: 8px; vertical-align: top; height: auto; width: 14.28%; }
                    .calendar-table .day-number { font-weight: bold; margin-bottom: 5px; color: #2c3e50; }
                    .calendar-table .event-item { font-size: 11px; padding: 2px 4px; margin-bottom: 2px; border-radius: 3px; color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    .event-list { margin-top: 30px; }
                    .event-list h3 { background-color: #f8f9fa; padding: 10px; border-radius: 5px; }
                    .event-list table { width: 100%; border-collapse: collapse; }
                    .event-list th { background-color: #34495e; color: white; padding: 8px; text-align: center; }
                    .event-list td { border: 1px solid #ddd; padding: 8px; }
                    .event-list tr:nth-child(even) { background-color: #f2f2f2; }
                    .footer { margin-top: 30px; text-align: left; font-size: 12px; color: #7f8c8d; }
                    .legend { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
                    .legend-item { display: flex; align-items: center; gap: 5px; }
                    .legend-color { width: 15px; height: 15px; border-radius: 3px; }
                }
                /* استایل‌های نمایشی (غیر چاپ) */
                body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; margin: 20px; }
                .print-header { text-align: center; margin-bottom: 30px; }
                .print-header h1 { color: #2c3e50; margin-bottom: 5px; }
                .print-header .date { color: #7f8c8d; font-size: 16px; }
                .calendar-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .calendar-table th { background-color: #3498db; color: white; padding: 10px; text-align: center; }
                .calendar-table td { border: 1px solid #ddd; padding: 8px; vertical-align: top; height: auto; width: 14.28%; }
                .calendar-table .day-number { font-weight: bold; margin-bottom: 5px; color: #2c3e50; }
                .calendar-table .event-item { font-size: 11px; padding: 2px 4px; margin-bottom: 2px; border-radius: 3px; color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .event-list { margin-top: 30px; }
                .event-list h3 { background-color: #f8f9fa; padding: 10px; border-radius: 5px; }
                .event-list table { width: 100%; border-collapse: collapse; }
                .event-list th { background-color: #34495e; color: white; padding: 8px; text-align: center; }
                .event-list td { border: 1px solid #ddd; padding: 8px; }
                .event-list tr:nth-child(even) { background-color: #f2f2f2; }
                .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #7f8c8d; }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="print-header">
                <h1>گزارش تقویم برنامه‌ها</h1>
                <div class="date">${monthName} ${currentYear}</div>
            </div>
    `;
    
    // ایجاد تقویم جدولی
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const startDay = firstDayOfMonth.getDay();
    
    let startOffset = startDay === 0 ? 6 : startDay - 1;
    
    const daysInMonth = lastDayOfMonth.getDate();
    let weekRows = Math.ceil((daysInMonth + startOffset) / 7);
    
    let tableHTML = '<table class="calendar-table">';
    tableHTML += '<thead><tr>';
    const weekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    weekDays.forEach(day => {
        tableHTML += `<th>${day}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    for (let row = 0; row < weekRows; row++) {
        tableHTML += '<tr>';
        for (let col = 0; col < 7; col++) {
            const cellDayNumber = (row * 7) + col + 1 - startOffset;
            
            if (cellDayNumber > 0 && cellDayNumber <= daysInMonth) {
                const currentDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(cellDayNumber).padStart(2, '0')}`;
                const dayEvents = events.filter(event => {
                    const eventDate = event.start ? new Date(event.start).toISOString().split('T')[0] : '';
                    return eventDate === currentDateStr;
                });
                
                let cellContent = `<div class="day-number">${cellDayNumber}</div>`;
                
                dayEvents.forEach(event => {
                    const color = event.backgroundColor || '#3498db';
                    cellContent += `<div class="event-item" style="background-color: ${color};">${event.title}</div>`;
                });
                
                tableHTML += `<td>${cellContent}</td>`;
            } else {
                tableHTML += '<td></td>';
            }
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table>';
    
    // ایجاد لیست تمام رویدادها
    let listHTML = `
        <div class="event-list">
            <h3>لیست تمام رویدادها</h3>
            <table>
                <thead>
                    <tr>
                        <th>ردیف</th>
                        <th>عنوان رویداد</th>
                        <th>نوع رویداد</th>
                        <th>تاریخ شروع</th>
                        <th>تاریخ پایان</th>
                        <th>ساعت</th>
                        <th>مکان</th>
                        <th>اولویت</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const sortedEvents = events.sort((a, b) => {
        return new Date(a.start) - new Date(b.start);
    });
    
    let rowNumber = 1;
    sortedEvents.forEach(event => {
        const startDate = event.start ? new Date(event.start).toLocaleDateString('fa-IR') : '-';
        const endDate = event.end ? new Date(event.end).toLocaleDateString('fa-IR') : '-';
        const startTime = event.start && !event.allDay ? new Date(event.start).toLocaleTimeString('fa-IR', {hour: '2-digit', minute: '2-digit'}) : 'تمام روز';
        
        let eventTypeText = '';
        switch(event.extendedProps?.type) {
            case 'work_order': eventTypeText = 'دستورکار'; break;
            case 'maintenance': eventTypeText = 'تعمیرات پیشگیرانه'; break;
            case 'inspection': eventTypeText = 'بازرسی'; break;
            case 'meeting': eventTypeText = 'جلسه'; break;
            case 'training': eventTypeText = 'آموزش'; break;
            case 'shutdown': eventTypeText = 'توقف خط'; break;
            default: eventTypeText = event.extendedProps?.type || 'سایر';
        }
        
        let priorityText = '';
        switch(event.extendedProps?.priority) {
            case 'low': priorityText = 'پایین'; break;
            case 'medium': priorityText = 'متوسط'; break;
            case 'high': priorityText = 'بالا'; break;
            case 'critical': priorityText = 'بحرانی'; break;
            default: priorityText = event.extendedProps?.priority || 'نامشخص';
        }
        
        listHTML += `
            <tr>
                <td style="text-align: center;">${rowNumber++}</td>
                <td>${event.title}</td>
                <td>${eventTypeText}</td>
                <td style="text-align: center;">${startDate}</td>
                <td style="text-align: center;">${endDate}</td>
                <td style="text-align: center;">${startTime}</td>
                <td>${event.extendedProps?.location || '-'}</td>
                <td style="text-align: center;">${priorityText}</td>
            </tr>
        `;
    });
    
    if (sortedEvents.length === 0) {
        listHTML += '<tr><td colspan="8" style="text-align: center;">هیچ رویدادی برای نمایش وجود ندارد</td></tr>';
    }
    
    listHTML += `
                </tbody>
            </table>
        </div>
        <div class="footer">
            <p>تعداد کل رویدادها: ${sortedEvents.length}</p>
            <p>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
        </div>
        </body>
        </html>
    `;
    
    // ایجاد یک iframe مخفی برای چاپ
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);
    
    // نوشتن محتوا در iframe
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printContent + tableHTML + listHTML);
    frameDoc.close();
    
    // چاپ بعد از بارگذاری کامل
    printFrame.onload = function() {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        // حذف iframe بعد از چاپ (با تأخیر)
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);
    };
}
















const holidayCalendar = require('holiday-calendar');
console.log('Module structure:', Object.keys(holidayCalendar));
console.log('Is holiday method exists:', typeof holidayCalendar.isHoliday === 'function');
console.log('Testing isHoliday method:', holidayCalendar.isHoliday('2026-01-01', 'CN'));
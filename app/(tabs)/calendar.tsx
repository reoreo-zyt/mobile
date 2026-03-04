import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// 导入holiday-calendar包并创建实例
import HolidayCalendar from 'holiday-calendar';
const holidayCalendar = new HolidayCalendar();





const CalendarScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [viewMode, setViewMode] = useState<'year' | 'month'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 状态管理
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [lunarCalendar, setLunarCalendar] = useState({});
  const [almanacData, setAlmanacData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从holiday-calendar获取节假日数据
  const fetchHolidayData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 使用holiday-calendar实例获取节假日数据
      const holidayMap: Record<string, string> = {};
      
      // 获取2026年的节假日数据
      const holidays = await holidayCalendar.getDates('CN', 2026, { type: 'public_holiday' });
      
      // 处理节假日数据
      holidays.forEach(holiday => {
        // 直接使用库返回的节假日名称，如果有的话
        holidayMap[holiday.date] = holiday.name || '节假日';
      });
      
      setHolidays(holidayMap);
    } catch (err) {
      setError('获取节假日数据失败');
      console.error('Error fetching holiday data:', err);
      // 如果获取失败，使用空对象
      setHolidays({});
    } finally {
      setLoading(false);
    }
  };

  // 从API获取黄历数据
  const fetchAlmanacData = async (date: string) => {
    try {
      // 尝试从免费的黄历API获取数据
      // 使用一个免费的黄历API服务
      const response = await fetch(`https://api.lunarcalendarapi.com/v1/date?date=${date}`);
      const data = await response.json();
      
      // 处理API响应数据
      if (data && data.success) {
        return {
          yi: data.data.yi || [],
          ji: data.data.ji || [],
          solarTerm: data.data.solarTerm || '',
          zodiac: data.data.zodiac || '',
          ganzhi: data.data.ganzhi || '',
          wuxing: data.data.wuxing || '',
          shishen: data.data.shishen || '',
          pengzubaiji: data.data.pengzubaiji || '',
          suijin: data.data.suijin || ''
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching almanac data:', err);
      // 如果获取失败，返回空数据
      return null;
    }
  };

  // 当选中日期变化时，获取黄历数据
  useEffect(() => {
    const loadAlmanacData = async () => {
      setLoading(true);
      try {
        // 从API获取黄历数据
        const almanac = await fetchAlmanacData(selectedDate);
        if (almanac) {
          setAlmanacData(prev => ({
            ...prev,
            [selectedDate]: almanac
          }));
        } else {
          // 如果获取失败，使用空数据
          setAlmanacData(prev => ({
            ...prev,
            [selectedDate]: null
          }));
        }
      } catch (err) {
        setError('获取黄历数据失败');
        console.error('Error fetching almanac data:', err);
        // 如果获取失败，使用空数据
        setAlmanacData(prev => ({
          ...prev,
          [selectedDate]: null
        }));
      } finally {
        setLoading(false);
      }
    };

    loadAlmanacData();
  }, [selectedDate]);

  // 从API获取农历日期数据
  const fetchLunarCalendarData = async () => {
    try {
      // 尝试从免费的农历API获取数据
      const year = selectedYear;
      const month = selectedMonth + 1;
      const response = await fetch(`https://api.lunarcalendarapi.com/v1/month?year=${year}&month=${month}`);
      const data = await response.json();
      
      // 处理API响应数据
      if (data && data.success) {
        const lunarMap: Record<string, string> = {};
        data.data.days.forEach((day: any) => {
          lunarMap[day.date] = day.lunarDate;
        });
        setLunarCalendar(lunarMap);
      }
    } catch (err) {
      console.error('Error fetching lunar calendar data:', err);
      // 如果获取失败，使用空对象
      setLunarCalendar({});
    }
  };

  // 当组件挂载时，获取节假日数据
  useEffect(() => {
    fetchHolidayData();
  }, []);

  // 当选中月份变化时，获取农历日期数据
  useEffect(() => {
    fetchLunarCalendarData();
  }, [selectedYear, selectedMonth]);

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  // 计算当前日期是第几周
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // 获取当前月份的周数信息
  const getCurrentWeekInfo = () => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    return `${selectedYear}年${monthNames[selectedMonth]} 第${weekNumber}周`;
  };

  // 生成年份视图的月份卡片
  const generateYearView = () => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(selectedYear, month, 1);
      const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
      const startDay = firstDay.getDay();
      
      months.push(
        <TouchableOpacity
          key={month}
          style={[styles.monthCard, isDark && styles.darkMonthCard]}
          onPress={() => {
            setSelectedMonth(month);
            setViewMode('month');
          }}
        >
          <Text style={[styles.monthName, isDark && styles.darkText]}>{monthNames[month]}</Text>
          <View style={styles.monthDays}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <Text key={index} style={[styles.monthWeekday, isDark && styles.darkText]}>{day}</Text>
            ))}
            {Array.from({ length: 42 }, (_, i) => {
              const day = i - startDay + 1;
              const dateStr = `${selectedYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isHoliday = holidays[dateStr];
              
              return (
                <View
                  key={i}
                  style={[
                    styles.monthDayCell,
                    day < 1 || day > daysInMonth && styles.emptyDayCell,
                    isToday && styles.todayDayCell,
                    isHoliday && styles.holidayDayCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthDayText,
                      isDark && styles.darkText,
                      day < 1 || day > daysInMonth && styles.emptyDayText,
                      isToday && styles.todayDayText,
                      isHoliday && styles.holidayDayText,
                    ]}
                  >
                    {day > 0 && day <= daysInMonth ? day : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      );
    }
    return months;
  };

  // 生成月份视图的日期
  const generateMonthView = () => {
    const days = [];
    const today = new Date();
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === selectedMonth;
      const isHoliday = holidays[dateStr];
      const lunarDate = lunarCalendar[dateStr];
      
      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dayContainer,
            isToday && styles.todayContainer,
            !isCurrentMonth && styles.otherMonthDay,
            isHoliday && styles.holidayContainer,
            selectedDate === dateStr && styles.selectedDayContainer,
          ]}
          onPress={() => setSelectedDate(dateStr)}
          disabled={!isCurrentMonth}
        >
          <Text
            style={[
              styles.dayText,
              isDark && styles.darkText,
              isToday && styles.todayText,
              !isCurrentMonth && styles.otherMonthText,
              isHoliday && styles.holidayText,
              selectedDate === dateStr && styles.selectedDayText,
            ]}
          >
            {currentDate.getDate()}
          </Text>
          {isCurrentMonth && (
            <Text style={[styles.lunarText, isDark && styles.darkText, isHoliday && styles.holidayLunarText, selectedDate === dateStr && styles.selectedLunarText]}>
              {lunarDate || ''}
            </Text>
          )}
          {isCurrentMonth && isHoliday && (
            <Text style={[styles.holidayLabel, isDark && styles.darkText]}>{isHoliday}</Text>
          )}
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setViewMode('year')}
          disabled={viewMode === 'year'}
        >
          {viewMode === 'month' && (
            <View style={styles.backButtonContent}>
              <MaterialIcons name="arrow-back" size={24} color={isDark ? '#fff' : '#007AFF'} />
              <Text style={[styles.backButtonText, isDark && styles.darkText]}>
                {getCurrentWeekInfo()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>
          {viewMode === 'year' ? `${selectedYear}年` : `${selectedYear}年 ${monthNames[selectedMonth]}`}
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      {viewMode === 'year' ? (
        <ScrollView style={styles.yearView}>
          <View style={styles.monthGrid}>
            {generateYearView()}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.monthView}>
          <View style={styles.weekdays}>
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <Text key={index} style={[styles.weekdayText, isDark && styles.darkText]}>
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.days}>
            {generateMonthView()}
          </View>
          
          <ScrollView style={styles.eventsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={isDark ? '#fff' : '#007AFF'} />
                <Text style={[styles.loadingText, isDark && styles.darkText]}>加载数据中...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color={isDark ? '#fff' : '#F44336'} />
                <Text style={[styles.errorText, isDark && styles.darkText]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, isDark && styles.darkRetryButton]}
                  onPress={() => {
                    loadAlmanacData();
                  }}
                >
                  <Text style={[styles.retryButtonText, isDark && styles.darkText]}>重试</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.eventsTitle, isDark && styles.darkText]}>当日信息</Text>
                
                {/* 选中日期的节假日信息 */}
                {(() => {
                  const selectedHoliday = holidays[selectedDate];
                  if (selectedHoliday) {
                    return (
                      <View style={[styles.eventItem, isDark && styles.darkEventItem]}>
                        <Text style={[styles.eventTime, isDark && styles.darkText]}>
                          {selectedDate.split('-').slice(1).join('-')}
                        </Text>
                        <View style={styles.eventContent}>
                          <Text style={[styles.eventTitle, isDark && styles.darkText]}>{selectedHoliday}</Text>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
                
                {/* 黄历信息 */}
                <Text style={[styles.eventsTitle, isDark && styles.darkText, { marginTop: 20 }]}>黄历</Text>
                {(() => {
                  const selectedAlmanac = almanacData[selectedDate];
                  if (selectedAlmanac) {
                    return (
                      <View style={[styles.eventItem, isDark && styles.darkEventItem]}>
                        <Text style={[styles.eventTime, isDark && styles.darkText]}>
                          {selectedDate.split('-').slice(1).join('-')}
                        </Text>
                        <View style={styles.almanacContent}>
                          <View style={styles.almanacItem}>
                            <Text style={[styles.almanacLabel, { color: '#4CAF50' }, isDark && styles.darkText]}>宜</Text>
                            <Text style={[styles.almanacText, isDark && styles.darkText]}>
                              {selectedAlmanac.yi.join('、')}
                            </Text>
                          </View>
                          <View style={styles.almanacItem}>
                            <Text style={[styles.almanacLabel, { color: '#F44336' }, isDark && styles.darkText]}>忌</Text>
                            <Text style={[styles.almanacText, isDark && styles.darkText]}>
                              {selectedAlmanac.ji.join('、')}
                            </Text>
                          </View>
                          <View style={styles.almanacDetailItem}>
                            <Text style={[styles.almanacDetailLabel, isDark && styles.darkText]}>节气：</Text>
                            <Text style={[styles.almanacDetailText, isDark && styles.darkText]}>
                              {selectedAlmanac.solarTerm}
                            </Text>
                          </View>
                          <View style={styles.almanacDetailItem}>
                            <Text style={[styles.almanacDetailLabel, isDark && styles.darkText]}>生肖：</Text>
                            <Text style={[styles.almanacDetailText, isDark && styles.darkText]}>
                              {selectedAlmanac.zodiac}
                            </Text>
                          </View>
                          <View style={styles.almanacDetailItem}>
                            <Text style={[styles.almanacDetailLabel, isDark && styles.darkText]}>干支：</Text>
                            <Text style={[styles.almanacDetailText, isDark && styles.darkText]}>
                              {selectedAlmanac.ganzhi}
                            </Text>
                          </View>
                          <View style={styles.almanacDetailItem}>
                            <Text style={[styles.almanacDetailLabel, isDark && styles.darkText]}>五行：</Text>
                            <Text style={[styles.almanacDetailText, isDark && styles.darkText]}>
                              {selectedAlmanac.wuxing}
                            </Text>
                          </View>
                          <View style={styles.almanacDetailItem}>
                            <Text style={[styles.almanacDetailLabel, isDark && styles.darkText]}>十神：</Text>
                            <Text style={[styles.almanacDetailText, isDark && styles.darkText]}>
                              {selectedAlmanac.shishen}
                            </Text>
                          </View>
                          <View style={styles.almanacDetailItem}>
                            <Text style={[styles.almanacDetailLabel, isDark && styles.darkText]}>彭祖百忌：</Text>
                            <Text style={[styles.almanacDetailText, isDark && styles.darkText]}>
                              {selectedAlmanac.pengzubaiji}
                            </Text>
                          </View>
                          <View style={styles.almanacDetailItem}>
                            <Text style={[styles.almanacDetailLabel, isDark && styles.darkText]}>岁时：</Text>
                            <Text style={[styles.almanacDetailText, isDark && styles.darkText]}>
                              {selectedAlmanac.suijin}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }
                  return (
                    <View style={[styles.eventItem, isDark && styles.darkEventItem]}>
                      <Text style={[styles.eventTime, isDark && styles.darkText]}>
                        {selectedDate.split('-').slice(1).join('-')}
                      </Text>
                      <View style={styles.almanacContent}>
                        <Text style={[styles.eventDescription, isDark && styles.darkText]}>
                          暂无黄历数据
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  backButton: {
    width: '50%',
    height: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  darkText: {
    color: '#fff',
  },
  yearView: {
    flex: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'center',
  },
  monthCard: {
    width: (width - 40) / 3,
    margin: 5,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkMonthCard: {
    backgroundColor: '#1e1e1e',
  },
  monthName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  monthDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthWeekday: {
    width: '14.28%',
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginBottom: 4,
  },
  monthDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDayCell: {
    opacity: 0,
  },
  todayDayCell: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  holidayDayCell: {
    backgroundColor: '#FF2D55',
    borderRadius: 10,
  },
  monthDayText: {
    fontSize: 10,
    color: '#333',
  },
  emptyDayText: {
    opacity: 0,
  },
  todayDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  holidayDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  monthView: {
    flex: 1,
  },
  weekdays: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  holidayContainer: {
    backgroundColor: '#FF2D55',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#999',
  },
  holidayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lunarText: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
  },
  holidayLabel: {
    fontSize: 8,
    color: '#fff',
    marginTop: 2,
  },
  holidayLunarText: {
    color: '#fff',
  },
  selectedDayContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#64B5F6',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedLunarText: {
    color: '#E3F2FD',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
  },
  eventContent: {
    flex: 1,
  },
  eventDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  almanacContent: {
    flex: 1,
  },
  almanacItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  almanacLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  almanacText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  almanacDetailItem: {
    flexDirection: 'row',
    marginTop: 8,
  },
  almanacDetailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    width: 60,
  },
  almanacDetailText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  darkRetryButton: {
    backgroundColor: '#1976D2',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsContainer: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 20,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  eventItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkEventItem: {
    backgroundColor: '#1e1e1e',
  },
  eventTime: {
    width: 60,
    fontSize: 14,
    color: '#666',
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default CalendarScreen;
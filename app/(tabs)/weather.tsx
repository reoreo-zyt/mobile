import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const WeatherScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [weather, setWeather] = useState({
    city: '北京',
    temperature: 22,
    condition: '晴',
    humidity: 45,
    windSpeed: 12,
    forecast: [
      { day: '今天', temp: 22, condition: '晴' },
      { day: '明天', temp: 24, condition: '多云' },
      { day: '后天', temp: 20, condition: '阴' },
      { day: '周四', temp: 18, condition: '小雨' },
      { day: '周五', temp: 21, condition: '晴' },
      { day: '周六', temp: 23, condition: '晴' },
      { day: '周日', temp: 25, condition: '多云' },
    ],
  });

  // 模拟天气数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        ...prev,
        temperature: prev.temperature + Math.floor(Math.random() * 3) - 1,
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 根据天气条件返回对应的图标
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case '晴':
        return '☀️';
      case '多云':
        return '⛅';
      case '阴':
        return '☁️';
      case '小雨':
        return '🌧️';
      case '大雨':
        return '⛈️';
      case '雪':
        return '❄️';
      default:
        return '☀️';
    }
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>天气</Text>
        <Text style={[styles.cityText, isDark && styles.darkText]}>{weather.city}</Text>
      </View>
      
      <View style={styles.currentWeather}>
        <Text style={[styles.temperature, isDark && styles.darkText]}>{weather.temperature}°C</Text>
        <Text style={[styles.condition, isDark && styles.darkText]}>{weather.condition} {getWeatherIcon(weather.condition)}</Text>
        <View style={styles.weatherDetails}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, isDark && styles.darkText]}>湿度</Text>
            <Text style={[styles.detailValue, isDark && styles.darkText]}>{weather.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, isDark && styles.darkText]}>风速</Text>
            <Text style={[styles.detailValue, isDark && styles.darkText]}>{weather.windSpeed} km/h</Text>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.forecastContainer}>
        <Text style={[styles.forecastTitle, isDark && styles.darkText]}>7天预报</Text>
        {weather.forecast.map((item, index) => (
          <View key={index} style={[styles.forecastItem, isDark && styles.darkForecastItem]}>
            <Text style={[styles.forecastDay, isDark && styles.darkText]}>{item.day}</Text>
            <Text style={[styles.forecastIcon]}>{getWeatherIcon(item.condition)}</Text>
            <Text style={[styles.forecastTemp, isDark && styles.darkText]}>{item.temp}°C</Text>
            <Text style={[styles.forecastCondition, isDark && styles.darkText]}>{item.condition}</Text>
          </View>
        ))}
      </ScrollView>
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
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cityText: {
    fontSize: 18,
    color: '#666',
  },
  darkText: {
    color: '#fff',
  },
  currentWeather: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  condition: {
    fontSize: 24,
    color: '#666',
    marginBottom: 20,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  forecastContainer: {
    flex: 1,
    marginTop: 20,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 15,
    color: '#333',
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
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
  darkForecastItem: {
    backgroundColor: '#1e1e1e',
  },
  forecastDay: {
    width: 60,
    fontSize: 16,
    color: '#333',
  },
  forecastIcon: {
    fontSize: 24,
  },
  forecastTemp: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  forecastCondition: {
    width: 60,
    fontSize: 16,
    color: '#666',
  },
});

export default WeatherScreen;
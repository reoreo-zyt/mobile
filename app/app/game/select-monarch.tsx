import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Monarch {
  id: string;
  name: string;
  cityColor: string;
  cityCount: number;
}

const SelectMonarchScreen = () => {
  const router = useRouter();
  const [monarchs, setMonarchs] = useState<Monarch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadMonarchs();
    };
    init();
  }, []);

  const loadSettings = async () => {
    try {
      // 检查 AsyncStorage 是否可用
      if (AsyncStorage) {
        const savedDarkMode = await AsyncStorage.getItem('isDarkMode');
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadMonarchs = async () => {
    try {
      // 直接使用模拟数据，避免 react-native-fs 相关的错误
      const mockMonarchs: Monarch[] = [
        { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 10 },
        { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 5 },
        { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 8 },
        { id: '4', name: '袁绍', cityColor: '#ff8800', cityCount: 7 },
        { id: '5', name: '袁术', cityColor: '#8800ff', cityCount: 4 },
        { id: '6', name: '董卓', cityColor: '#ff00ff', cityCount: 6 },
        { id: '7', name: '吕布', cityColor: '#00ffff', cityCount: 3 },
        { id: '8', name: '刘表', cityColor: '#ffff00', cityCount: 5 },
      ];
      setMonarchs(mockMonarchs);
    } catch (error) {
      console.error('Error loading monarchs:', error);
      // 如果读取失败，使用模拟数据
      const mockMonarchs: Monarch[] = [
        { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 10 },
        { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 5 },
        { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 8 },
      ];
      setMonarchs(mockMonarchs);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMonarch = (monarch: Monarch) => {
    // 实现选择君主的功能
    console.log('Selected monarch:', monarch);
  };

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <Text style={[styles.loadingText, isDarkMode && styles.darkLoadingText]}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Text style={[styles.title, isDarkMode && styles.darkTitle]}>选择君主</Text>
      <ScrollView style={styles.scrollView}>
        {monarchs.map((monarch) => (
          <TouchableOpacity
            key={monarch.id}
            style={[styles.monarchItem, isDarkMode && styles.darkMonarchItem]}
            onPress={() => handleSelectMonarch(monarch)}
          >
            <View style={[styles.cityColorIndicator, { backgroundColor: monarch.cityColor }]} />
            <View style={styles.monarchInfo}>
              <Text style={[styles.monarchName, isDarkMode && styles.darkMonarchName]}>{monarch.name}</Text>
              <Text style={[styles.cityCount, isDarkMode && styles.darkCityCount]}>城池数量: {monarch.cityCount}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.backButton, isDarkMode && styles.darkBackButton]} onPress={() => router.back()}>
        <Text style={[styles.backButtonText, isDarkMode && styles.darkBackButtonText]}>返回</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f0', // 宣纸白
    padding: 20,
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a', // 墨黑
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c2c2c', // 墨色
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  darkTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0e0d8', // 宣纸白
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  monarchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // 白色
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#d4d4d0', // 浅灰色
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkMonarchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a', // 深灰色
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3a3a3a', // 灰色
  },
  cityColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
  },
  monarchInfo: {
    flex: 1,
  },
  monarchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c', // 墨色
    marginBottom: 5,
  },
  darkMonarchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0e0d8', // 宣纸白
    marginBottom: 5,
  },
  cityCount: {
    fontSize: 14,
    color: '#666666', // 灰色
  },
  darkCityCount: {
    fontSize: 14,
    color: '#a0a0a0', // 浅灰色
  },
  backButton: {
    backgroundColor: '#f0f0e8', // 浅米色
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4d4d0', // 浅灰色
  },
  darkBackButton: {
    backgroundColor: '#3a3a3a', // 灰色
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a4a4a', // 深灰色
  },
  backButtonText: {
    color: '#2c2c2c', // 墨色
    fontSize: 16,
    fontWeight: 'bold',
  },
  darkBackButtonText: {
    color: '#e0e0d8', // 宣纸白
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#2c2c2c', // 墨色
    fontSize: 18,
  },
  darkLoadingText: {
    color: '#e0e0d8', // 宣纸白
    fontSize: 18,
  },
});

export default SelectMonarchScreen;
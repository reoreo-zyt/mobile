import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as XLSX from 'xlsx';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as FileSystem from 'expo-file-system';

interface Monarch {
  id: string;
  name: string;
  cityColor: string;
  cityCount: number;
}

const SelectMonarchScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [monarchs, setMonarchs] = useState<Monarch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    loadMonarchs();
  }, []);

  const loadMonarchs = async () => {
    try {
      console.log('Loading monarch data from Excel file...');
      
      // 尝试使用不同的路径加载 Excel 文件
      const possiblePaths = [
        '311_data.xlsx',
        './311_data.xlsx',
        './public/311_data.xlsx',
        '/311_data.xlsx',
        '/public/311_data.xlsx',
        'https://localhost:8081/311_data.xlsx',
        'https://localhost:8081/public/311_data.xlsx'
      ];
      
      let data: Uint8Array | null = null;
      let successfulPath: string | null = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying to fetch Excel file from: ${path}`);
          const response = await fetch(path);
          
          if (!response.ok) {
            console.log(`Fetch failed with status: ${response.status}`);
            continue;
          }
          
          const arrayBuffer = await response.arrayBuffer();
          data = new Uint8Array(arrayBuffer);
          successfulPath = path;
          console.log(`Excel file fetched successfully from: ${path}`);
          break;
        } catch (fetchError) {
          console.log(`Error fetching from ${path}:`, fetchError);
          continue;
        }
      }
      
      if (data) {
        // 解析 Excel 文件
        console.log('Parsing Excel file...');
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 检查是否存在君主表
        if (!workbook.Sheets['君主表']) {
          throw new Error('君主表 not found in Excel file');
        }
        
        const worksheet = workbook.Sheets['君主表'];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Found ${jsonData.length} monarchs in Excel file`);
        
        // 转换数据格式
        const parsedMonarchs: Monarch[] = jsonData.map((item: any, index: number) => {
          // 计算城池数量
          let cityCount = 0;
          if (item['citys']) {
            cityCount = item['citys'].split(',').length;
          }
          
          return {
            id: (index + 1).toString(),
            name: item['name'] || '未知',
            cityColor: item['color'] || '#999999',
            cityCount: cityCount
          };
        });
        
        console.log('Monarch data processed successfully');
        setMonarchs(parsedMonarchs);
      } else {
        // 备用方案：使用模拟数据
        console.log('Using mock data as fallback...');
        const mockMonarchs: Monarch[] = [
          { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 5 },
          { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 3 },
          { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 4 },
          { id: '4', name: '袁绍', cityColor: '#ffff00', cityCount: 6 },
          { id: '5', name: '袁术', cityColor: '#ff00ff', cityCount: 2 }
        ];
        
        console.log('Using mock monarch data');
        setMonarchs(mockMonarchs);
      }
    } catch (error) {
      console.error('Error loading monarchs:', error);
      // 提供详细的错误信息，但不抛出异常，使用模拟数据
      console.log('Using mock data due to error...');
      const mockMonarchs: Monarch[] = [
        { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 5 },
        { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 3 },
        { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 4 },
        { id: '4', name: '袁绍', cityColor: '#ffff00', cityCount: 6 },
        { id: '5', name: '袁术', cityColor: '#ff00ff', cityCount: 2 }
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
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, PanResponder, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as XLSX from 'xlsx';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Monarch {
  id: string;
  name: string;
  cityColor: string;
  cityCount: number;
}

interface City {
  id: string;
  name: string;
  position_x: number;
  position_y: number;
  ownerId: string;
  color: string;
  rule: number; // 统治值
  population: number; // 人口
  soldiers: number; // 兵力
  agriculture: number; // 农业
  commerce: number; // 商业
  waterControl: number; // 治水
  gold: number; // 金
  grain: number; // 粮
  generalCount: number; // 武将数量
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GameMapScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  
  const [selectedMonarch, setSelectedMonarch] = useState<Monarch | null>(null);
  const [monarchs, setMonarchs] = useState<Monarch[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [generals, setGenerals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('加载游戏数据中...');
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [year, setYear] = useState(189);
  const [month, setMonth] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [showCityList, setShowCityList] = useState(true);
  const [mapX, setMapX] = useState(0);
  const [mapY, setMapY] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showGeneralList, setShowGeneralList] = useState(false);
  const [showInternalAffairs, setShowInternalAffairs] = useState(false);
  const [currentMonarchIndex, setCurrentMonarchIndex] = useState(0);
  const [actionPhase, setActionPhase] = useState<'player' | 'ai'>('player');
  const [actionMessage, setActionMessage] = useState('');
  const [showActionMessage, setShowActionMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  
  // 计算政令数量
  const calculateDecreeCount = () => {
    if (!selectedMonarch) return 3;
    const baseDecrees = 3;
    const extraCities = Math.max(0, selectedMonarch.cityCount - 3);
    return Math.min(baseDecrees + extraCities, 5);
  };
  
  // 创建PanResponder处理地图拖动
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (_, gestureState) => {
      // 检查是否是点击而不是拖动
      if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
        // 点击地图时关闭城池列表
        if (showCityList) {
          setShowCityList(false);
        }
        return false; // 不启动PanResponder
      }
      return false;
    },
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      pan.setValue({
        x: mapX + gestureState.dx,
        y: mapY + gestureState.dy,
      });
    },
    onPanResponderRelease: (_, gestureState) => {
      setMapX(mapX + gestureState.dx);
      setMapY(mapY + gestureState.dy);
      pan.setValue({
        x: mapX + gestureState.dx,
        y: mapY + gestureState.dy,
      });
    },
  });
  
  // 处理地图缩放
  const handleZoom = (factor: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale * factor));
    setScale(newScale);
  };
  
  // 处理点击城池列表项
  const handleCityListItemPress = (city: City) => {
    setSelectedCity(city);
    // 计算位置以定位到选中的城池
    const mapCenterX = screenWidth / 2;
    const mapCenterY = screenHeight / 2;
    const cityX = city.position_x;
    const cityY = city.position_y;
    
    // 计算需要移动的位置，使城池位于屏幕中央
    const newMapX = mapCenterX - cityX;
    const newMapY = mapCenterY - cityY;
    
    // 设置地图位置
    setMapX(newMapX);
    setMapY(newMapY);
    pan.setValue({ x: newMapX, y: newMapY });
  };
  
  // 调整视图以显示所有城池
  const adjustViewToShowAllCities = () => {
    if (cities.length === 0) return;
    
    // 计算所有城池的边界
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    cities.forEach(city => {
      minX = Math.min(minX, city.position_x);
      maxX = Math.max(maxX, city.position_x);
      minY = Math.min(minY, city.position_y);
      maxY = Math.max(maxY, city.position_y);
    });
    
    // 计算城池的宽度和高度
    const citiesWidth = maxX - minX;
    const citiesHeight = maxY - minY;
    
    // 计算合适的缩放级别，确保所有城池都能在屏幕内显示
    const screenRatio = screenWidth / screenHeight;
    const citiesRatio = citiesWidth / citiesHeight;
    
    let optimalScale = 1;
    if (citiesRatio > screenRatio) {
      // 以宽度为基准
      optimalScale = (screenWidth * 0.8) / citiesWidth;
    } else {
      // 以高度为基准
      optimalScale = (screenHeight * 0.8) / citiesHeight;
    }
    
    // 限制缩放范围
    optimalScale = Math.max(0.5, Math.min(3, optimalScale));
    setScale(optimalScale);
    
    // 计算中心点
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // 计算需要的位置，使中心点位于屏幕中央
    const mapCenterX = screenWidth / 2;
    const mapCenterY = screenHeight / 2;
    const newMapX = mapCenterX - centerX;
    const newMapY = mapCenterY - centerY;
    
    // 设置地图位置
    setMapX(newMapX);
    setMapY(newMapY);
    pan.setValue({ x: newMapX, y: newMapY });
  };
  
  const loadGameData = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      setLoadingText('加载游戏数据中...');
      
      console.log('Loading game data from Excel file...');
      
      // 尝试使用不同的路径加载 Excel 文件
      const possiblePaths = [
        '/311_data.xlsx',
      ];
      
      let data: ArrayBuffer | null = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying to fetch Excel file from: ${path}`);
          setLoadingProgress(10);
          setLoadingText(`载入游戏中...`);
          const response = await fetch(path);
          
          if (!response.ok) {
            console.log(`Fetch failed with status: ${response.status}`);
            continue;
          }
          
          data = await response.arrayBuffer();
          console.log(`Excel file fetched successfully from: ${path}`);
          setLoadingProgress(30);
          setLoadingText(`载入游戏中...`);
          break;
        } catch (fetchError) {
          console.log(`Error fetching from ${path}:`, fetchError);
          continue;
        }
      }
      
      if (data && data instanceof ArrayBuffer) {
        // 解析 Excel 文件
        console.log('Parsing Excel file...');
        try {
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 加载君主表
          setLoadingProgress(40);
          setLoadingText('正在加载君主数据...');
          if (workbook.Sheets['君主表']) {
            const worksheet = workbook.Sheets['君主表'];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log(`Found ${jsonData.length} monarchs in Excel file`);
            
            // 转换数据格式
            console.log('Excel data keys:', Object.keys(jsonData[0] || {}));
            console.log('First item data:', jsonData[0] || {});
            
            const parsedMonarchs: Monarch[] = jsonData.map((item: any, index: number) => {
              // 计算城池数量
              let cityCount = 0;
              if (item['citys'] || item['cities'] || item['城市']) {
                const cityField = item['citys'] || item['cities'] || item['城市'];
                cityCount = cityField.split(',').length;
              }
              
              // 尝试获取颜色字段，支持不同的字段名
              let color = '#999999';
              
              // 支持多种可能的颜色字段名称
              const colorFields = ['color', 'Color', 'COLOR', '颜色', 'colour', 'Colour', 'COLOUR'];
              let foundColor = false;
              
              for (const field of colorFields) {
                if (item[field]) {
                  color = item[field];
                  foundColor = true;
                  console.log(`Monarch ${item['name'] || '未知'} color from ${field}: ${color}`);
                  break;
                }
              }
              
              if (!foundColor) {
                console.log(`Monarch ${item['name'] || '未知'} has no color field`);
              }
              
              // 确保颜色值是有效的十六进制格式
              if (typeof color === 'string') {
                // 如果是颜色名称，转换为十六进制
                const colorNameMap: { [key: string]: string } = {
                  'red': '#ff0000',
                  'green': '#00ff00',
                  'blue': '#0000ff',
                  'yellow': '#ffff00',
                  'purple': '#800080',
                  'orange': '#ffa500',
                  'pink': '#ffc0cb',
                  'brown': '#a52a2a',
                  'gray': '#808080',
                  'grey': '#808080',
                  'black': '#000000',
                  'white': '#ffffff'
                };
                
                // 转换颜色名称
                const lowerColor = color.toLowerCase();
                if (colorNameMap[lowerColor]) {
                  color = colorNameMap[lowerColor];
                  console.log(`Converted color name ${color} to hex: ${color}`);
                }
                
                // 确保是有效的十六进制颜色
                if (!color.match(/^#[0-9A-Fa-f]{6}$/)) {
                  console.log(`Invalid color format: ${color}, using default gray`);
                  color = '#999999';
                }
              }
              
              return {
                id: item['id'] || (index + 1).toString(),
                name: item['name'] || item['Name'] || item['NAME'] || item['君主'] || '未知',
                cityColor: color,
                cityCount: cityCount
              };
            });
            
            console.log('Monarch data processed successfully');
            setMonarchs(parsedMonarchs);
          } else {
            console.log('君主表 not found in Excel file, using mock data');
            // 使用模拟数据
            const mockMonarchs: Monarch[] = [
              { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 5 },
              { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 3 },
              { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 4 },
              { id: '4', name: '袁绍', cityColor: '#ffff00', cityCount: 6 },
              { id: '5', name: '袁术', cityColor: '#ff00ff', cityCount: 2 }
            ];
            setMonarchs(mockMonarchs);
          }
          
          // 加载武将表
          setLoadingProgress(60);
          setLoadingText('正在加载武将数据...');
          let generalsData: any[] = [];
          if (workbook.Sheets['武将表']) {
            const worksheet = workbook.Sheets['武将表'];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log(`Found ${jsonData.length} generals in Excel file`);
            
            // 转换数据格式
            console.log('Excel general data keys:', Object.keys(jsonData[0] || {}));
            console.log('First general item data:', jsonData[0] || {});
            
            generalsData = jsonData.map((item: any, index: number) => ({
              id: item['id'] || (index + 1).toString(),
              name: item['name'] || item['Name'] || item['NAME'] || '未知',
              cityId: item['cityId'] || item['city_id'] || item['CityId'] || item['CITYID'] || '0',
              work: parseFloat(item['work'] || item['Work'] || item['WORK'] || '0'),
              born: parseFloat(item['born'] || item['Born'] || item['BORN'] || '0'),
              command: parseFloat(item['command'] || item['Command'] || item['COMMAND'] || item['统'] || '0'),
              force: parseFloat(item['force'] || item['Force'] || item['FORCE'] || item['武'] || '0'),
              intelligence: parseFloat(item['intelligence'] || item['Intelligence'] || item['INTELLIGENCE'] || item['智'] || '0'),
              politics: parseFloat(item['politics'] || item['Politics'] || item['POLITICS'] || item['政'] || '0'),
              morality: parseFloat(item['morality'] || item['Morality'] || item['MORALITY'] || item['德'] || '0')
            }));
            
            console.log('General data processed successfully');
            setGenerals(generalsData);
          } else {
            console.log('武将表 not found in Excel file, using mock data');
            // 使用模拟数据
            const mockGenerals = [
              { id: '1', name: '夏侯惇', cityId: '1', work: 189, born: 155, command: 85, force: 90, intelligence: 70, politics: 65, morality: 80 },
              { id: '2', name: '张辽', cityId: '1', work: 189, born: 169, command: 90, force: 85, intelligence: 80, politics: 70, morality: 85 },
              { id: '3', name: '关羽', cityId: '3', work: 189, born: 160, command: 95, force: 98, intelligence: 75, politics: 60, morality: 90 },
              { id: '4', name: '张飞', cityId: '3', work: 189, born: 165, command: 85, force: 95, intelligence: 60, politics: 50, morality: 80 },
              { id: '5', name: '周瑜', cityId: '4', work: 189, born: 175, command: 92, force: 75, intelligence: 95, politics: 85, morality: 85 },
              { id: '6', name: '陆逊', cityId: '4', work: 189, born: 183, command: 88, force: 70, intelligence: 90, politics: 80, morality: 85 },
              { id: '7', name: '袁绍', cityId: '2', work: 189, born: 154, command: 75, force: 60, intelligence: 70, politics: 75, morality: 65 },
              { id: '8', name: '袁术', cityId: '5', work: 189, born: 155, command: 60, force: 50, intelligence: 65, politics: 70, morality: 40 }
            ];
            generalsData = mockGenerals;
            setGenerals(mockGenerals);
          }
          
          // 加载城池表
          setLoadingProgress(80);
          setLoadingText('正在加载城池数据...');
          if (workbook.Sheets['城池表']) {
            const worksheet = workbook.Sheets['城池表'];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log(`Found ${jsonData.length} cities in Excel file`);
            
            // 转换数据格式
            console.log('Excel city data keys:', Object.keys(jsonData[0] || {}));
            console.log('First city item data:', jsonData[0] || {});
            
            const parsedCities: City[] = jsonData.map((item: any, index: number) => {
              // 统计该城市的武将数量，只统计work小于等于当前年份的武将
              const currentYear = 189;
              const cityId = item['id'] || (index + 1).toString();
              const generalCount = generalsData.filter(general => general.cityId === cityId && general.work <= currentYear).length;
              
              return {
                id: cityId,
                name: item['name'] || item['Name'] || '城市' || '未知',
                position_x: parseFloat(item['position_x'] || item['positionX'] || 'PositionX' || '0'),
                position_y: parseFloat(item['position_y'] || item['positionY'] || 'PositionY' || '0'),
                ownerId: item['ownerId'] || item['owner_id'] || '0',
                color: '#999999', // 默认灰色
                rule: parseFloat(item['统治值'] || item['rule'] || '0'),
                population: parseFloat(item['人口'] || item['population'] || '0'),
                soldiers: parseFloat(item['兵力'] || item['soldiers'] || '0'),
                agriculture: parseFloat(item['农业'] || item['agriculture'] || '0'),
                commerce: parseFloat(item['商业'] || item['commerce'] || '0'),
                waterControl: parseFloat(item['治水'] || item['waterControl'] || '0'),
                gold: parseFloat(item['金'] || item['gold'] || '0'),
                grain: parseFloat(item['粮'] || item['grain'] || '0'),
                generalCount: generalCount
              };
            });
            
            console.log('City data processed successfully');
            setCities(parsedCities);
          } else {
            console.log('城池表 not found in Excel file, using mock data');
            // 使用模拟数据
            const mockCities: City[] = [
              { id: '1', name: '洛阳', position_x: 100, position_y: 100, ownerId: '1', color: '#ff0000', rule: 90, population: 100000, soldiers: 50000, agriculture: 80, commerce: 90, waterControl: 70, gold: 50000, grain: 100000, generalCount: 5 },
              { id: '2', name: '长安', position_x: 200, position_y: 150, ownerId: '1', color: '#ff0000', rule: 85, population: 90000, soldiers: 45000, agriculture: 75, commerce: 85, waterControl: 65, gold: 45000, grain: 90000, generalCount: 4 },
              { id: '3', name: '成都', position_x: 300, position_y: 200, ownerId: '2', color: '#00ff00', rule: 80, population: 80000, soldiers: 40000, agriculture: 90, commerce: 70, waterControl: 85, gold: 40000, grain: 120000, generalCount: 3 },
              { id: '4', name: '建业', position_x: 400, position_y: 100, ownerId: '3', color: '#0000ff', rule: 88, population: 95000, soldiers: 48000, agriculture: 70, commerce: 95, waterControl: 80, gold: 55000, grain: 85000, generalCount: 4 },
              { id: '5', name: '襄阳', position_x: 250, position_y: 120, ownerId: '0', color: '#999999', rule: 70, population: 60000, soldiers: 30000, agriculture: 65, commerce: 60, waterControl: 75, gold: 30000, grain: 70000, generalCount: 2 }
            ];
            setCities(mockCities);
          }
          
          setLoadingProgress(100);
          setLoadingText('加载完成！');
          setMapReady(true);
        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError);
          // 使用模拟数据
          console.log('Using mock data due to parsing error...');
          
          // 模拟君主数据
          const mockMonarchs: Monarch[] = [
            { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 5 },
            { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 3 },
            { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 4 },
            { id: '4', name: '袁绍', cityColor: '#ffff00', cityCount: 6 },
            { id: '5', name: '袁术', cityColor: '#ff00ff', cityCount: 2 }
          ];
          setMonarchs(mockMonarchs);
          
          // 模拟武将数据
          const mockGenerals = [
            { id: '1', name: '夏侯惇', cityId: '1' },
            { id: '2', name: '张辽', cityId: '1' },
            { id: '3', name: '关羽', cityId: '3' },
            { id: '4', name: '张飞', cityId: '3' },
            { id: '5', name: '周瑜', cityId: '4' },
            { id: '6', name: '陆逊', cityId: '4' },
            { id: '7', name: '袁绍', cityId: '2' },
            { id: '8', name: '袁术', cityId: '5' }
          ];
          setGenerals(mockGenerals);
          
          // 模拟城池数据
          const mockCities: City[] = [
            { id: '1', name: '洛阳', position_x: 100, position_y: 100, ownerId: '1', color: '#ff0000', rule: 90, population: 100000, soldiers: 50000, agriculture: 80, commerce: 90, waterControl: 70, gold: 50000, grain: 100000, generalCount: 5 },
            { id: '2', name: '长安', position_x: 200, position_y: 150, ownerId: '1', color: '#ff0000', rule: 85, population: 90000, soldiers: 45000, agriculture: 75, commerce: 85, waterControl: 65, gold: 45000, grain: 90000, generalCount: 4 },
            { id: '3', name: '成都', position_x: 300, position_y: 200, ownerId: '2', color: '#00ff00', rule: 80, population: 80000, soldiers: 40000, agriculture: 90, commerce: 70, waterControl: 85, gold: 40000, grain: 120000, generalCount: 3 },
            { id: '4', name: '建业', position_x: 400, position_y: 100, ownerId: '3', color: '#0000ff', rule: 88, population: 95000, soldiers: 48000, agriculture: 70, commerce: 95, waterControl: 80, gold: 55000, grain: 85000, generalCount: 4 },
            { id: '5', name: '襄阳', position_x: 250, position_y: 120, ownerId: '0', color: '#999999', rule: 70, population: 60000, soldiers: 30000, agriculture: 65, commerce: 60, waterControl: 75, gold: 30000, grain: 70000, generalCount: 2 }
          ];
          setCities(mockCities);
          setMapReady(true);
        }
      } else {
        // 备用方案：使用模拟数据
        console.log('Using mock data as fallback...');
        
        // 模拟君主数据
        const mockMonarchs: Monarch[] = [
          { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 5 },
          { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 3 },
          { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 4 },
          { id: '4', name: '袁绍', cityColor: '#ffff00', cityCount: 6 },
          { id: '5', name: '袁术', cityColor: '#ff00ff', cityCount: 2 }
        ];
        setMonarchs(mockMonarchs);
        
        // 模拟武将数据
        const mockGenerals = [
          { id: '1', name: '夏侯惇', cityId: '1' },
          { id: '2', name: '张辽', cityId: '1' },
          { id: '3', name: '关羽', cityId: '3' },
          { id: '4', name: '张飞', cityId: '3' },
          { id: '5', name: '周瑜', cityId: '4' },
          { id: '6', name: '陆逊', cityId: '4' },
          { id: '7', name: '袁绍', cityId: '2' },
          { id: '8', name: '袁术', cityId: '5' }
        ];
        setGenerals(mockGenerals);
        
        // 模拟城池数据
        const mockCities: City[] = [
          { id: '1', name: '洛阳', position_x: 100, position_y: 100, ownerId: '1', color: '#ff0000', rule: 90, population: 100000, soldiers: 50000, agriculture: 80, commerce: 90, waterControl: 70, gold: 50000, grain: 100000, generalCount: 5 },
          { id: '2', name: '长安', position_x: 200, position_y: 150, ownerId: '1', color: '#ff0000', rule: 85, population: 90000, soldiers: 45000, agriculture: 75, commerce: 85, waterControl: 65, gold: 45000, grain: 90000, generalCount: 4 },
          { id: '3', name: '成都', position_x: 300, position_y: 200, ownerId: '2', color: '#00ff00', rule: 80, population: 80000, soldiers: 40000, agriculture: 90, commerce: 70, waterControl: 85, gold: 40000, grain: 120000, generalCount: 3 },
          { id: '4', name: '建业', position_x: 400, position_y: 100, ownerId: '3', color: '#0000ff', rule: 88, population: 95000, soldiers: 48000, agriculture: 70, commerce: 95, waterControl: 80, gold: 55000, grain: 85000, generalCount: 4 },
          { id: '5', name: '襄阳', position_x: 250, position_y: 120, ownerId: '0', color: '#999999', rule: 70, population: 60000, soldiers: 30000, agriculture: 65, commerce: 60, waterControl: 75, gold: 30000, grain: 70000, generalCount: 2 }
        ];
        setCities(mockCities);
        setMapReady(true);
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      // 提供详细的错误信息，但不抛出异常，使用模拟数据
      console.log('Using mock data due to error...');
      
      // 模拟君主数据
      const mockMonarchs: Monarch[] = [
        { id: '1', name: '曹操', cityColor: '#ff0000', cityCount: 5 },
        { id: '2', name: '刘备', cityColor: '#00ff00', cityCount: 3 },
        { id: '3', name: '孙权', cityColor: '#0000ff', cityCount: 4 },
        { id: '4', name: '袁绍', cityColor: '#ffff00', cityCount: 6 },
        { id: '5', name: '袁术', cityColor: '#ff00ff', cityCount: 2 }
      ];
      setMonarchs(mockMonarchs);
      
      // 模拟武将数据
      const mockGenerals = [
        { id: '1', name: '夏侯惇', cityId: '1' },
        { id: '2', name: '张辽', cityId: '1' },
        { id: '3', name: '关羽', cityId: '3' },
        { id: '4', name: '张飞', cityId: '3' },
        { id: '5', name: '周瑜', cityId: '4' },
        { id: '6', name: '陆逊', cityId: '4' },
        { id: '7', name: '袁绍', cityId: '2' },
        { id: '8', name: '袁术', cityId: '5' }
      ];
      setGenerals(mockGenerals);
      
      // 模拟城池数据
      const mockCities: City[] = [
        { id: '1', name: '洛阳', position_x: 100, position_y: 100, ownerId: '1', color: '#ff0000', rule: 90, population: 100000, soldiers: 50000, agriculture: 80, commerce: 90, waterControl: 70, gold: 50000, grain: 100000, generalCount: 5 },
        { id: '2', name: '长安', position_x: 200, position_y: 150, ownerId: '1', color: '#ff0000', rule: 85, population: 90000, soldiers: 45000, agriculture: 75, commerce: 85, waterControl: 65, gold: 45000, grain: 90000, generalCount: 4 },
        { id: '3', name: '成都', position_x: 300, position_y: 200, ownerId: '2', color: '#00ff00', rule: 80, population: 80000, soldiers: 40000, agriculture: 90, commerce: 70, waterControl: 85, gold: 40000, grain: 120000, generalCount: 3 },
        { id: '4', name: '建业', position_x: 400, position_y: 100, ownerId: '3', color: '#0000ff', rule: 88, population: 95000, soldiers: 48000, agriculture: 70, commerce: 95, waterControl: 80, gold: 55000, grain: 85000, generalCount: 4 },
        { id: '5', name: '襄阳', position_x: 250, position_y: 120, ownerId: '0', color: '#999999', rule: 70, population: 60000, soldiers: 30000, agriculture: 65, commerce: 60, waterControl: 75, gold: 30000, grain: 70000, generalCount: 2 }
      ];
      setCities(mockCities);
      setMapReady(true);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // 从参数中获取选中的君主信息
    if (params.monarch) {
      try {
        const monarchData = JSON.parse(decodeURIComponent(params.monarch as string));
        setSelectedMonarch(monarchData);
      } catch (error) {
        console.error('Failed to parse monarch data:', error);
      }
    }
    loadGameData();
  }, [params.monarch]);
  
  // 当城池数据加载完成后，调整视图以显示所有城池
  useEffect(() => {
    if (mapReady && cities.length > 0) {
      adjustViewToShowAllCities();
    }
  }, [mapReady, cities]);
  
  // 当选择君主后，定位到君主拥有的城池
  useEffect(() => {
    if (selectedMonarch && cities.length > 0) {
      // 筛选出君主拥有的城池
      const monarchCities = cities.filter(city => city.ownerId === selectedMonarch.id);
      
      if (monarchCities.length > 0) {
        // 计算君主城池的中心点
        let totalX = 0;
        let totalY = 0;
        
        monarchCities.forEach(city => {
          totalX += city.position_x;
          totalY += city.position_y;
        });
        
        const centerX = totalX / monarchCities.length;
        const centerY = totalY / monarchCities.length;
        
        // 计算需要移动的位置，使中心点位于屏幕中央
        const mapCenterX = screenWidth / 2;
        const mapCenterY = screenHeight / 2;
        const newMapX = mapCenterX - centerX;
        const newMapY = mapCenterY - centerY;
        
        // 设置地图位置
        setMapX(newMapX);
        setMapY(newMapY);
        pan.setValue({ x: newMapX, y: newMapY });
      }
    }
  }, [selectedMonarch, cities, scale, pan]);
  

  
  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.loadingContainer]}>
        <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>{loadingText}</Text>
        <View style={[styles.progressBarContainer, isDarkMode && styles.darkProgressBarContainer]}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${loadingProgress}%` },
              isDarkMode && styles.darkProgressBar
            ]} 
          />
        </View>
        <Text style={[styles.progressText, isDarkMode && styles.darkText]}>{loadingProgress}%</Text>
      </View>
    );
  }
  
  // 处理点击外部关闭城池列表
  const handleMapPress = () => {
    if (showCityList) {
      setShowCityList(false);
    }
  };

  // 处理存储游戏
  const handleSaveGame = () => {
    // 存储游戏逻辑
    console.log('存储游戏');
    setShowSettings(false);
  };

  // 处理返回主菜单
  const handleBackToMenu = () => {
    router.replace('/');
  };

  // 处理退出游戏
  const handleExitGame = () => {
    // 退出游戏逻辑
    console.log('退出游戏');
  };

  // 游戏主逻辑

  // 处理结束回合
  const handleEndTurn = () => {
    // 推进到下一个月份
    setMonth(prevMonth => {
      if (prevMonth === 12) {
        setYear(prevYear => prevYear + 1);
        return 1;
      }
      return prevMonth + 1;
    });

    // 处理AI行动
    handleAIActions();

    // 推进到下一个君主
    setCurrentMonarchIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % monarchs.length;
      const nextMonarch = monarchs[nextIndex];
      
      // 显示行动消息
      setActionMessage(`轮到 ${nextMonarch.name} 行动了`);
      setShowActionMessage(true);
      
      // 3秒后隐藏消息
      setTimeout(() => {
        setShowActionMessage(false);
      }, 3000);
      
      // 如果是玩家君主，切换到玩家行动阶段
      if (nextMonarch.id === selectedMonarch?.id) {
        setActionPhase('player');
      } else {
        setActionPhase('ai');
        // AI自动行动
        setTimeout(() => {
          handleAIActions();
        }, 1000);
      }
      
      return nextIndex;
    });
  };

  // 处理AI行动
  const handleAIActions = () => {
    // AI完善城池内政
    const updatedCities = cities.map(city => {
      // 只有AI君主的城池才会增长
      const cityMonarch = monarchs.find(m => m.id === city.ownerId);
      if (cityMonarch && cityMonarch.id !== selectedMonarch?.id) {
        // 随机增长城池数值
        return {
          ...city,
          agriculture: Math.min(100, city.agriculture + Math.floor(Math.random() * 5)),
          commerce: Math.min(100, city.commerce + Math.floor(Math.random() * 5)),
          waterControl: Math.min(100, city.waterControl + Math.floor(Math.random() * 5)),
          rule: Math.min(100, city.rule + Math.floor(Math.random() * 3))
        };
      }
      return city;
    });
    setCities(updatedCities);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* 顶部信息栏 */}
      <View style={[styles.topBar, isDarkMode && styles.darkTopBar]}>
        <Text style={[styles.monarchName, isDarkMode && styles.darkText]}>
          {selectedMonarch?.name || '未知君主'}
        </Text>
        <Text style={[styles.dateText, isDarkMode && styles.darkText]}>
          {year}年{month}月
        </Text>
        <View style={styles.topBarRight}>
          <View style={styles.decreeContainer}>
            <Text style={[styles.decreeLabel, isDarkMode && styles.darkText]}>政令:</Text>
            <View style={styles.decreeIcons}>
              {Array.from({ length: calculateDecreeCount() }).map((_, index) => (
                <View key={index} style={[styles.decreeIcon, { backgroundColor: selectedMonarch?.cityColor || '#999999' }]} />
              ))}
            </View>
          </View>
          {/* 设置按钮 */}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={[styles.settingsButtonText, isDarkMode && styles.darkText]}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 行动消息显示 */}
      {showActionMessage && (
        <View style={[styles.actionMessageContainer, isDarkMode && styles.darkActionMessageContainer]}>
          <Text style={[styles.actionMessageText, isDarkMode && styles.darkText]}>{actionMessage}</Text>
        </View>
      )}
      
      {/* 主内容区域 */}
      <View style={styles.mainContent}>
        {/* 地图区域 */}
        <View style={styles.mapContainer}>
          <View style={styles.mapBackground} {...panResponder.panHandlers}>
            <Animated.View 
              style={[
                styles.mapContent,
                {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                  ],
                },
              ]}
            >
              {/* 城池 */}
              {cities.map((city) => {
                const x = city.position_x;
                const y = city.position_y;
                
                let cityColor = city.color;
                if (city.ownerId === '0') {
                  cityColor = '#999999';
                } else {
                  // 查找对应的君主，设置其颜色
                  const monarch = monarchs.find(m => m.id === city.ownerId);
                  if (monarch) {
                    cityColor = monarch.cityColor;
                  }
                }
                
                // 只有点击选择君主的城池时才弹出信息
                const handleCityPress = () => {
                  if (selectedMonarch && city.ownerId === selectedMonarch.id) {
                    setSelectedCity(city);
                  }
                };
                
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityContainer,
                      {
                        left: x,
                        top: y,
                      }
                    ]}
                    onPress={handleCityPress}
                  >
                    <View 
                      style={[
                        styles.cityCircle, 
                        { 
                          backgroundColor: cityColor,
                          transform: [{ scale }]
                        }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.flagPole, 
                        { 
                          backgroundColor: '#8B4513',
                          transform: [{ scale }]
                        }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.flag, 
                        { 
                          backgroundColor: cityColor,
                          transform: [{ scale }]
                        }
                      ]} 
                    />
                    <Text style={[
                      styles.cityNameText,
                      { transform: [{ scale }] }
                    ]}>
                      {city.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </View>
          
          {/* 缩放控制 */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={[styles.zoomButton, isDarkMode && styles.darkZoomButton]}
              onPress={() => handleZoom(1.2)}
            >
              <Text style={[styles.zoomButtonText, isDarkMode && styles.darkText]}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoomButton, isDarkMode && styles.darkZoomButton]}
              onPress={() => handleZoom(0.8)}
            >
              <Text style={[styles.zoomButtonText, isDarkMode && styles.darkText]}>-</Text>
            </TouchableOpacity>
          </View>
          
          {/* 显示/隐藏城池列表按钮 */}
          <TouchableOpacity
            style={[styles.toggleCityListButton, isDarkMode && styles.darkToggleCityListButton]}
            onPress={() => setShowCityList(!showCityList)}
          >
            <Text style={[styles.toggleCityListText, isDarkMode && styles.darkText]}>
              {showCityList ? '≡' : '≡'}
            </Text>
          </TouchableOpacity>
          
          {/* 结束回合按钮 */}
          <TouchableOpacity
            style={[styles.endTurnButton, isDarkMode && styles.darkEndTurnButton]}
            onPress={handleEndTurn}
          >
            <Text style={[styles.endTurnButtonText, isDarkMode && styles.darkText]}>结束回合</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 左侧城池列表 - 放在地图后面以显示在上层 */}
      {showCityList && (
        <View style={[styles.cityListContainer, isDarkMode && styles.darkCityListContainer, styles.cityListOverlay]}>
          <View style={styles.cityListHeader}>
            <Text style={[styles.cityListTitle, isDarkMode && styles.darkText]}>城池列表</Text>
            <TouchableOpacity onPress={() => setShowCityList(false)}>
              <Text style={[styles.closeButtonText, isDarkMode && styles.darkText]}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.cityList}>
            {
            cities
              .filter(city => selectedMonarch && city.ownerId === selectedMonarch.id)
              .map((city) => {
              let cityColor = city.color;
              if (selectedMonarch && city.ownerId === selectedMonarch.id) {
                cityColor = selectedMonarch.cityColor;
              }
              
              return (
                <TouchableOpacity
                  key={city.id}
                  style={[styles.cityListItem, isDarkMode && styles.darkCityListItem]}
                  onPress={() => handleCityListItemPress(city)}
                >
                  <View style={[styles.cityListColor, { backgroundColor: cityColor }]} />
                  <Text style={[styles.cityListName, isDarkMode && styles.darkText]}>{city.name}</Text>
                  <Text style={[styles.cityListOwner, isDarkMode && styles.darkText]}>
                    君主: {selectedMonarch?.name || '未知'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      
      {/* 城池信息弹窗 */}
      {selectedCity && (
        <View style={[styles.cityModal, isDarkMode && styles.darkCityModal, styles.largeCityModal]}>
          <View style={styles.cityModalHeader}>
            <Text style={[styles.cityModalTitle, isDarkMode && styles.darkText]}>{selectedCity.name}</Text>
            <TouchableOpacity
              style={styles.closeButtonIcon}
              onPress={() => setSelectedCity(null)}
            >
              <Text style={[styles.closeButtonIconText, isDarkMode && styles.darkText]}>×</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.cityModalInfo, isDarkMode && styles.darkText]}>
            位置: ({selectedCity.position_x}, {selectedCity.position_y})
          </Text>
          <Text style={[styles.cityModalInfo, isDarkMode && styles.darkText]}>
            所有者: {selectedCity.ownerId === '0' ? '无' : `ID: ${selectedCity.ownerId}`}
          </Text>
          <View style={styles.cityStatsContainer}>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>统治值:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.rule}</Text>
            </View>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>人口:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.population}</Text>
            </View>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>兵力:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.soldiers}</Text>
            </View>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>农业:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.agriculture}</Text>
            </View>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>商业:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.commerce}</Text>
            </View>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>治水:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.waterControl}</Text>
            </View>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>金:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.gold}</Text>
            </View>
            <View style={styles.cityStatRow}>
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>粮:</Text>
              <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.grain}</Text>
            </View>
            <TouchableOpacity 
              style={styles.cityStatRow}
              onPress={() => setShowGeneralList(true)}
            >
              <Text style={[styles.cityStatLabel, isDarkMode && styles.darkText]}>武将数量:</Text>
              <View style={styles.generalCountContainer}>
                <Text style={[styles.cityStatValue, isDarkMode && styles.darkText]}>{selectedCity.generalCount}</Text>
                <Text style={[styles.generalIcon, isDarkMode && styles.darkText]}>👨‍✈️</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.cityActionButtons}>
            <TouchableOpacity
              style={[styles.cityActionButton, isDarkMode && styles.darkCityActionButton]}
              onPress={() => setShowInternalAffairs(true)}
            >
              <Text style={[styles.cityActionButtonText, isDarkMode && styles.darkText]}>内政</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cityActionButton, isDarkMode && styles.darkCityActionButton]}
              onPress={() => console.log('外交')}
            >
              <Text style={[styles.cityActionButtonText, isDarkMode && styles.darkText]}>外交</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cityActionButton, isDarkMode && styles.darkCityActionButton]}
              onPress={() => console.log('战争')}
            >
              <Text style={[styles.cityActionButtonText, isDarkMode && styles.darkText]}>战争</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 武将列表弹窗 */}
      {showGeneralList && selectedCity && (
        <View style={[styles.settingsModal, isDarkMode && styles.darkSettingsModal]}>
          <TouchableOpacity 
            style={styles.settingsModalOverlay}
            activeOpacity={1}
            onPress={() => setShowGeneralList(false)}
          />
          <View style={[styles.generalListModalContent, isDarkMode && styles.darkSettingsModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.settingsModalTitle, isDarkMode && styles.darkText]}>{selectedCity.name} 武将列表</Text>
              <TouchableOpacity
                style={styles.closeButtonIcon}
                onPress={() => setShowGeneralList(false)}
              >
                <Text style={[styles.closeButtonIconText, isDarkMode && styles.darkText]}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.generalList}>
              {generals
                .filter(general => general.cityId === selectedCity.id && general.work <= year)
                .map((general) => {
                  const age = year - general.born;
                  return (
                    <View key={general.id} style={[styles.generalItem, isDarkMode && styles.darkGeneralItem]}>
                      <Text style={[styles.generalName, isDarkMode && styles.darkText]}>{general.name}</Text>
                      <View style={styles.generalStats}>
                        <Text style={[styles.generalStat, isDarkMode && styles.darkText]}>统: {general.command}</Text>
                        <Text style={[styles.generalStat, isDarkMode && styles.darkText]}>武: {general.force}</Text>
                        <Text style={[styles.generalStat, isDarkMode && styles.darkText]}>智: {general.intelligence}</Text>
                        <Text style={[styles.generalStat, isDarkMode && styles.darkText]}>政: {general.politics}</Text>
                        <Text style={[styles.generalStat, isDarkMode && styles.darkText]}>德: {general.morality}</Text>
                        <Text style={[styles.generalStat, isDarkMode && styles.darkText]}>年龄: {age}</Text>
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 内政弹窗 */}
      {showInternalAffairs && selectedCity && (
        <View style={[styles.settingsModal, isDarkMode && styles.darkSettingsModal]}>
          <TouchableOpacity 
            style={styles.settingsModalOverlay}
            activeOpacity={1}
            onPress={() => setShowInternalAffairs(false)}
          />
          <View style={[styles.internalAffairsModalContent, isDarkMode && styles.darkSettingsModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.settingsModalTitle, isDarkMode && styles.darkText]}>{selectedCity.name} 内政</Text>
              <TouchableOpacity
                style={styles.closeButtonIcon}
                onPress={() => setShowInternalAffairs(false)}
              >
                <Text style={[styles.closeButtonIconText, isDarkMode && styles.darkText]}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.internalAffairsButtons}>
              <TouchableOpacity
                style={[styles.internalAffairsButton, isDarkMode && styles.darkInternalAffairsButton]}
                onPress={() => console.log('开垦')}
              >
                <Text style={[styles.internalAffairsButtonText, isDarkMode && styles.darkText]}>开垦</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.internalAffairsButton, isDarkMode && styles.darkInternalAffairsButton]}
                onPress={() => console.log('劝商')}
              >
                <Text style={[styles.internalAffairsButtonText, isDarkMode && styles.darkText]}>劝商</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.internalAffairsButton, isDarkMode && styles.darkInternalAffairsButton]}
                onPress={() => console.log('治水')}
              >
                <Text style={[styles.internalAffairsButtonText, isDarkMode && styles.darkText]}>治水</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.internalAffairsButton, isDarkMode && styles.darkInternalAffairsButton]}
                onPress={() => console.log('巡查')}
              >
                <Text style={[styles.internalAffairsButtonText, isDarkMode && styles.darkText]}>巡查</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 设置弹窗 */}
      {showSettings && (
        <View style={[styles.settingsModal, isDarkMode && styles.darkSettingsModal]}>
          <TouchableOpacity 
            style={styles.settingsModalOverlay}
            activeOpacity={1}
            onPress={() => setShowSettings(false)}
          />
          <View style={[styles.settingsModalContent, isDarkMode && styles.darkSettingsModalContent]}>
            <Text style={[styles.settingsModalTitle, isDarkMode && styles.darkText]}>设置</Text>
            <TouchableOpacity
              style={[styles.settingsOption, isDarkMode && styles.darkSettingsOption]}
              onPress={handleSaveGame}
            >
              <Text style={[styles.settingsOptionText, isDarkMode && styles.darkText]}>存储游戏</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingsOption, isDarkMode && styles.darkSettingsOption]}
              onPress={handleBackToMenu}
            >
              <Text style={[styles.settingsOptionText, isDarkMode && styles.darkText]}>返回主菜单</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingsOption, isDarkMode && styles.darkSettingsOption]}
              onPress={handleExitGame}
            >
              <Text style={[styles.settingsOptionText, isDarkMode && styles.darkText]}>退出游戏</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeButton, isDarkMode && styles.darkCloseButton]}
              onPress={() => setShowSettings(false)}
            >
              <Text style={[styles.closeButtonText, isDarkMode && styles.darkText]}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f0', // 宣纸白
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a', // 墨黑
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e8e0d0', // 浅宣纸色
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d0', // 浅灰色
    zIndex: 50,
  },
  darkTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a', // 深灰色
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a', // 灰色
    zIndex: 50,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  monarchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c', // 墨色
  },
  dateText: {
    fontSize: 16,
    color: '#666666', // 灰色
  },
  decreeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decreeLabel: {
    fontSize: 16,
    color: '#666666', // 灰色
    marginRight: 5,
  },
  decreeIcons: {
    flexDirection: 'row',
  },
  decreeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 5,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  cityListContainer: {
    width: 200,
    backgroundColor: '#e8e0d0',
    borderRightWidth: 1,
    borderRightColor: '#d4d4d0',
  },
  cityListOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  darkCityListContainer: {
    width: 200,
    backgroundColor: '#2a2a2a',
    borderRightWidth: 1,
    borderRightColor: '#3a3a3a',
  },
  cityListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d0',
  },
  cityListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  cityList: {
    flex: 1,
  },
  cityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d0',
  },
  darkCityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  cityListColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  cityListName: {
    flex: 1,
    fontSize: 14,
    color: '#2c2c2c',
  },
  cityListOwner: {
    fontSize: 12,
    color: '#666666',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0e6d2',
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  mapContent: {
    width: 3000,
    height: 2000,
    position: 'relative',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkZoomButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  toggleCityListButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkToggleCityListButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCityListText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  cityContainer: {
    position: 'absolute',
    width: 40,
    height: 60,
    alignItems: 'center',
  },
  cityCircle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#333',
    top: 15,
    left: 5,
  },
  flagPole: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#8B4513',
    top: 0,
    left: 19,
  },
  flag: {
    position: 'absolute',
    width: 10,
    height: 10,
    top: -5,
    left: 15,
    transform: [{ rotate: '-45deg' }],
  },
  cityNameText: {
    position: 'absolute',
    top: 45,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    width: 60,
  },
  cityLabels: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666666', // 灰色
  },
  cityModal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -200 }],
    width: 300,
    backgroundColor: '#ffffff', // 白色
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 200,
  },
  darkCityModal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -200 }],
    width: 300,
    backgroundColor: '#2a2a2a', // 深灰色
    padding: 20,
    borderRadius: 8,
  },
  cityStatsContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  cityStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  cityStatLabel: {
    fontSize: 14,
    color: '#666666',
  },
  cityStatValue: {
    fontSize: 14,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  cityActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  cityActionButton: {
    flex: 1,
    backgroundColor: '#f0f0e8',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  darkCityActionButton: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cityActionButtonText: {
    color: '#2c2c2c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButtonIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonIconText: {
    fontSize: 24,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  cityModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c', // 墨色
    marginBottom: 10,
    textAlign: 'center',
  },
  cityModalInfo: {
    fontSize: 14,
    color: '#666666', // 灰色
    marginBottom: 5,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#f0f0e8', // 浅米色
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  darkCloseButton: {
    marginTop: 15,
    backgroundColor: '#3a3a3a', // 灰色
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#2c2c2c', // 墨色
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f0f0e8', // 浅米色
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4d4d0', // 浅灰色
  },
  darkBackButton: {
    backgroundColor: '#3a3a3a', // 灰色
    padding: 15,
    borderRadius: 8,
    margin: 20,
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
  settingsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
  },
  darkSettingsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
  },
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  settingsModalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkSettingsModalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 8,
  },
  settingsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsOption: {
    backgroundColor: '#f0f0e8',
    padding: 15,
    borderRadius: 4,
    marginBottom: 10,
    alignItems: 'center',
  },
  darkSettingsOption: {
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 4,
    marginBottom: 10,
    alignItems: 'center',
  },
  settingsOptionText: {
    color: '#2c2c2c',
    fontSize: 14,
  },
  darkText: {
    color: '#e0e0d8', // 宣纸白
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#2c2c2c',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '80%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 16,
    color: '#2c2c2c',
  },
  darkProgressBarContainer: {
    backgroundColor: '#3a3a3a',
  },
  darkProgressBar: {
    backgroundColor: '#4CAF50',
  },
  generalCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generalIcon: {
    fontSize: 16,
    marginLeft: 5,
  },
  generalListModalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -200 }],
    width: 300,
    maxHeight: 400,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  internalAffairsModalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
    width: 300,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  generalList: {
    flex: 1,
  },
  generalItem: {
    backgroundColor: '#f0f0e8',
    padding: 15,
    borderRadius: 4,
    marginBottom: 10,
  },
  darkGeneralItem: {
    backgroundColor: '#3a3a3a',
  },
  generalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 10,
  },
  generalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  generalStat: {
    fontSize: 14,
    color: '#666666',
  },
  internalAffairsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  internalAffairsButton: {
    flex: 1,
    backgroundColor: '#f0f0e8',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 120,
  },
  darkInternalAffairsButton: {
    backgroundColor: '#3a3a3a',
  },
  internalAffairsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  endTurnButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkEndTurnButton: {
    backgroundColor: '#45a049',
  },
  endTurnButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionMessageContainer: {
    position: 'absolute',
    top: 60,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  darkActionMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  actionMessageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameMapScreen;
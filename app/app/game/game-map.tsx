import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as XLSX from 'xlsx';
import { useColorScheme } from '@/hooks/use-color-scheme';
import LoadingSpinner from '@/components/LoadingSpinner';

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
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GameMapScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  
  const [selectedMonarch, setSelectedMonarch] = useState<Monarch | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [year, setYear] = useState(189);
  const [month, setMonth] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [showCityList, setShowCityList] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 计算政令数量
  const calculateDecreeCount = () => {
    if (!selectedMonarch) return 3;
    const baseDecrees = 3;
    const extraCities = Math.max(0, selectedMonarch.cityCount - 3);
    return Math.min(baseDecrees + extraCities, 5);
  };
  
  // 处理地图缩放
  const handleZoom = (factor: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale * factor));
    setScale(newScale);
  };
  
  // 处理点击城池列表项
  const handleCityListItemPress = (city: City) => {
    setSelectedCity(city);
    // 计算滚动位置以定位到选中的城池
    const mapCenterX = screenWidth / 2;
    const mapCenterY = screenHeight / 2;
    const cityX = city.position_x;
    const cityY = city.position_y;
    
    // 计算需要滚动的位置
    const newScrollX = cityX - mapCenterX / scale;
    const newScrollY = cityY - mapCenterY / scale;
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: newScrollX, y: newScrollY, animated: true });
    }
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
    
    // 计算需要的滚动位置
    const mapCenterX = screenWidth / 2;
    const mapCenterY = screenHeight / 2;
    const newScrollX = centerX - mapCenterX / optimalScale;
    const newScrollY = centerY - mapCenterY / optimalScale;
    
    // 滚动到中心点
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: newScrollX, y: newScrollY, animated: true });
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
    loadCities();
  }, [params.monarch]);
  
  // 当城池数据加载完成后，调整视图以显示所有城池
  useEffect(() => {
    if (mapReady && cities.length > 0) {
      adjustViewToShowAllCities();
    }
  }, [mapReady, cities]);
  
  const loadCities = async () => {
    try {
      console.log('Loading city data from Excel file...');
      
      // 尝试使用不同的路径加载 Excel 文件
      const possiblePaths = [
        '311_data.xlsx',
        './311_data.xlsx',
        './public/311_data.xlsx',
        '/311_data.xlsx',
        '/public/311_data.xlsx',
        'https://localhost:8081/311_data.xlsx',
        'https://localhost:8081/public/311_data.xlsx',
        'https://localhost:8082/311_data.xlsx',
        'https://localhost:8082/public/311_data.xlsx'
      ];
      
      let data: ArrayBuffer | null = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying to fetch Excel file from: ${path}`);
          const response = await fetch(path);
          
          if (!response.ok) {
            console.log(`Fetch failed with status: ${response.status}`);
            continue;
          }
          
          data = await response.arrayBuffer();
          console.log(`Excel file fetched successfully from: ${path}`);
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
        
          // 检查是否存在城池表
          if (!workbook.Sheets['城池表']) {
            throw new Error('城池表 not found in Excel file');
          }
          
          const worksheet = workbook.Sheets['城池表'];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log(`Found ${jsonData.length} cities in Excel file`);
          
          // 转换数据格式
          console.log('Excel city data keys:', Object.keys(jsonData[0] || {}));
          console.log('First city item data:', jsonData[0] || {});
          
          const parsedCities: City[] = jsonData.map((item: any, index: number) => {
            return {
              id: (index + 1).toString(),
              name: item['name'] || item['Name'] || item['NAME'] || '城市' || '未知',
              position_x: parseFloat(item['position_x'] || item['positionX'] || item['PositionX'] || '0'),
              position_y: parseFloat(item['position_y'] || item['positionY'] || item['PositionY'] || '0'),
              ownerId: item['ownerId'] || item['owner_id'] || item['OwnerId'] || item['OWNERID'] || '0',
              color: '#999999' // 默认灰色
            };
          });
          
          console.log('City data processed successfully');
          setCities(parsedCities);
          setMapReady(true);
        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError);
          // 使用模拟数据
          console.log('Using mock city data due to parsing error...');
          const mockCities: City[] = [
            { id: '1', name: '洛阳', position_x: 100, position_y: 100, ownerId: '1', color: '#ff0000' },
            { id: '2', name: '长安', position_x: 200, position_y: 150, ownerId: '1', color: '#ff0000' },
            { id: '3', name: '成都', position_x: 300, position_y: 200, ownerId: '2', color: '#00ff00' },
            { id: '4', name: '建业', position_x: 400, position_y: 100, ownerId: '3', color: '#0000ff' },
            { id: '5', name: '襄阳', position_x: 250, position_y: 120, ownerId: '0', color: '#999999' }
          ];
          
          setCities(mockCities);
          setMapReady(true);
        }
      } else {
        // 备用方案：使用模拟数据
        console.log('Using mock city data as fallback...');
        const mockCities: City[] = [
          { id: '1', name: '洛阳', position_x: 100, position_y: 100, ownerId: '1', color: '#ff0000' },
          { id: '2', name: '长安', position_x: 200, position_y: 150, ownerId: '1', color: '#ff0000' },
          { id: '3', name: '成都', position_x: 300, position_y: 200, ownerId: '2', color: '#00ff00' },
          { id: '4', name: '建业', position_x: 400, position_y: 100, ownerId: '3', color: '#0000ff' },
          { id: '5', name: '襄阳', position_x: 250, position_y: 120, ownerId: '0', color: '#999999' }
        ];
        
        console.log('Using mock city data');
        setCities(mockCities);
        setMapReady(true);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      // 提供详细的错误信息，但不抛出异常，使用模拟数据
      console.log('Using mock city data due to error...');
      const mockCities: City[] = [
        { id: '1', name: '洛阳', position_x: 100, position_y: 100, ownerId: '1', color: '#ff0000' },
        { id: '2', name: '长安', position_x: 200, position_y: 150, ownerId: '1', color: '#ff0000' },
        { id: '3', name: '成都', position_x: 300, position_y: 200, ownerId: '2', color: '#00ff00' },
        { id: '4', name: '建业', position_x: 400, position_y: 100, ownerId: '3', color: '#0000ff' },
        { id: '5', name: '襄阳', position_x: 250, position_y: 120, ownerId: '0', color: '#999999' }
      ];
      
      setCities(mockCities);
      setMapReady(true);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <LoadingSpinner text="加载地图中..." />
      </View>
    );
  }
  
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
        <View style={styles.decreeContainer}>
          <Text style={[styles.decreeLabel, isDarkMode && styles.darkText]}>政令:</Text>
          <View style={styles.decreeIcons}>
            {Array.from({ length: calculateDecreeCount() }).map((_, index) => (
              <View key={index} style={[styles.decreeIcon, { backgroundColor: selectedMonarch?.cityColor || '#999999' }]} />
            ))}
          </View>
        </View>
      </View>
      
      {/* 主内容区域 */}
      <View style={styles.mainContent}>
        {/* 左侧城池列表 */}
        {showCityList && (
          <View style={[styles.cityListContainer, isDarkMode && styles.darkCityListContainer]}>
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
                console.log(city, selectedMonarch, '==data==')
                
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
        
        {/* 地图区域 */}
        <View style={styles.mapContainer}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            horizontal={true}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mapContent}>
              {/* 城池 */}
              {cities.map((city) => {
                const x = city.position_x;
                const y = city.position_y;
                
                let cityColor = city.color;
                if (city.ownerId === '0') {
                  cityColor = '#999999';
                } else if (selectedMonarch && city.ownerId === selectedMonarch.id) {
                  cityColor = selectedMonarch.cityColor;
                }
                
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
                    onPress={() => setSelectedCity(city)}
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
            </View>
          </ScrollView>
          
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
        </View>
      </View>
      
      {/* 城池信息弹窗 */}
      {selectedCity && (
        <View style={[styles.cityModal, isDarkMode && styles.darkCityModal]}>
          <Text style={[styles.cityModalTitle, isDarkMode && styles.darkText]}>{selectedCity.name}</Text>
          <Text style={[styles.cityModalInfo, isDarkMode && styles.darkText]}>
            位置: ({selectedCity.position_x}, {selectedCity.position_y})
          </Text>
          <Text style={[styles.cityModalInfo, isDarkMode && styles.darkText]}>
            所有者: {selectedCity.ownerId === '0' ? '无' : `ID: ${selectedCity.ownerId}`}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, isDarkMode && styles.darkCloseButton]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={[styles.closeButtonText, isDarkMode && styles.darkText]}>关闭</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 返回按钮 */}
      <TouchableOpacity
        style={[styles.backButton, isDarkMode && styles.darkBackButton]}
        onPress={() => router.back()}
      >
        <Text style={[styles.backButtonText, isDarkMode && styles.darkBackButtonText]}>返回</Text>
      </TouchableOpacity>
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
  },
  darkTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a', // 深灰色
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a', // 灰色
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
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
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
  },
  darkCityModal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    backgroundColor: '#2a2a2a', // 深灰色
    padding: 20,
    borderRadius: 8,
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
  darkText: {
    color: '#e0e0d8', // 宣纸白
  },
});

export default GameMapScreen;
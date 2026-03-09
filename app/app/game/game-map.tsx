import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedMonarch, setSelectedMonarch] = useState<Monarch | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [year, setYear] = useState(189);
  const [month, setMonth] = useState(1);
  const [mapReady, setMapReady] = useState(false);
  
  // 计算政令数量
  const calculateDecreeCount = () => {
    if (!selectedMonarch) return 3;
    const baseDecrees = 3;
    const extraCities = Math.max(0, selectedMonarch.cityCount - 3);
    return Math.min(baseDecrees + extraCities, 5);
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
      
      let data: Uint8Array | null = null;
      
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
            name: item['name'] || item['Name'] || item['NAME'] || item['城市'] || '未知',
            position_x: parseFloat(item['position_x'] || item['positionX'] || item['PositionX'] || '0'),
            position_y: parseFloat(item['position_y'] || item['positionY'] || item['PositionY'] || '0'),
            ownerId: item['ownerId'] || item['owner_id'] || item['OwnerId'] || item['OWNERID'] || '0',
            color: '#999999' // 默认灰色
          };
        });
        
        console.log('City data processed successfully');
        setCities(parsedCities);
        setMapReady(true);
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
  
  useEffect(() => {
    // 渲染地图
    console.log('Rendering map with', cities.length, 'cities');
    if (canvasRef.current && cities.length > 0) {
      renderMap();
    }
  }, [cities, scale, offsetX, offsetY, selectedMonarch]);
  
  useEffect(() => {
    // 当选择君主后，居中显示君主的城市
    if (selectedMonarch && mapReady && cities.length > 0) {
      console.log('Centering map on monarch cities');
      
      // 找到君主的所有城市
      const monarchCities = cities.filter(city => city.ownerId === selectedMonarch.id);
      
      if (monarchCities.length > 0) {
        // 计算城市的平均位置
        let totalX = 0;
        let totalY = 0;
        
        monarchCities.forEach(city => {
          totalX += city.position_x;
          totalY += city.position_y;
        });
        
        const avgX = totalX / monarchCities.length;
        const avgY = totalY / monarchCities.length;
        
        console.log('Monarch cities average position:', avgX, avgY);
        
        // 计算偏移量，使君主的城市居中显示
        if (canvasRef.current) {
          const centerX = canvasRef.current.width / 2;
          const centerY = canvasRef.current.height / 2;
          
          const newOffsetX = centerX - (avgX * 50 * scale);
          const newOffsetY = centerY - (avgY * 50 * scale);
          
          setOffsetX(newOffsetX);
          setOffsetY(newOffsetY);
          
          console.log('New offset:', newOffsetX, newOffsetY);
        }
      }
    }
  }, [selectedMonarch, mapReady, cities, scale]);
  
  const renderMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref is null');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Could not get canvas context');
      return;
    }
    
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制地图背景
    ctx.fillStyle = '#f0e6d2'; // 宣纸色
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制城池
    console.log('Drawing', cities.length, 'cities');
    cities.forEach(city => {
      // 计算城池在画布上的位置（调整到画布中心）
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const x = centerX + (city.position_x * 50 * scale) + offsetX;
      const y = centerY + (city.position_y * 50 * scale) + offsetY;
      
      console.log('Drawing city', city.name, 'at', x, y);
      
      // 确定城池颜色
      let cityColor = city.color;
      if (city.ownerId === '0') {
        cityColor = '#999999'; // 未占领的城池为灰色
      } else if (selectedMonarch && city.ownerId === selectedMonarch.id) {
        cityColor = selectedMonarch.cityColor; // 我方城池使用君主颜色
      }
      
      console.log('City', city.name, 'color:', cityColor);
      
      // 绘制城池底座（丹青）
      ctx.beginPath();
      ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
      ctx.fillStyle = cityColor;
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      
      // 绘制旗帜
      // 旗杆
      ctx.beginPath();
      ctx.moveTo(x, y - 15 * scale);
      ctx.lineTo(x, y - 30 * scale);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      
      // 旗帜
      ctx.beginPath();
      ctx.moveTo(x, y - 25 * scale);
      ctx.lineTo(x + 10 * scale, y - 30 * scale);
      ctx.lineTo(x, y - 35 * scale);
      ctx.closePath();
      ctx.fillStyle = cityColor;
      ctx.fill();
      
      // 绘制城池名称
      ctx.font = `${12 * scale}px Arial`;
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(city.name, x, y + 25 * scale);
    });
  };
  
  const handleCanvasPress = (event: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.nativeEvent.pageX - rect.left;
    const y = event.nativeEvent.pageY - rect.top;
    
    // 检查是否点击了城池
    for (const city of cities) {
      const cityX = (city.position_x * scale) + offsetX;
      const cityY = (city.position_y * scale) + offsetY;
      
      const distance = Math.sqrt((x - cityX) ** 2 + (y - cityY) ** 2);
      if (distance <= 15 * scale) {
        setSelectedCity(city);
        break;
      }
    }
  };
  
  const handleCanvasTouchStart = (event: any) => {
    setIsDragging(true);
    setLastX(event.nativeEvent.pageX);
    setLastY(event.nativeEvent.pageY);
  };
  
  const handleCanvasTouchMove = (event: any) => {
    if (isDragging) {
      const deltaX = event.nativeEvent.pageX - lastX;
      const deltaY = event.nativeEvent.pageY - lastY;
      
      setOffsetX(prev => prev + deltaX);
      setOffsetY(prev => prev + deltaY);
      
      setLastX(event.nativeEvent.pageX);
      setLastY(event.nativeEvent.pageY);
    }
  };
  
  const handleCanvasTouchEnd = () => {
    setIsDragging(false);
  };
  
  const handleZoom = (factor: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale * factor));
    setScale(newScale);
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
      
      {/* 地图区域 */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          // Web平台使用Canvas
          <canvas
            ref={canvasRef}
            width={screenWidth}
            height={screenHeight - 100}
            style={styles.canvas}
            onClick={handleCanvasPress}
            onMouseDown={handleCanvasTouchStart}
            onMouseMove={handleCanvasTouchMove}
            onMouseUp={handleCanvasTouchEnd}
            onMouseLeave={handleCanvasTouchEnd}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          />
        ) : (
          // 移动平台使用View组件模拟地图
          <View 
            style={styles.mapView}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          >
            {cities.map((city) => {
              const centerX = screenWidth / 2;
              const centerY = (screenHeight - 100) / 2;
              const x = centerX + (city.position_x * 50 * scale) + offsetX;
              const y = centerY + (city.position_y * 50 * scale) + offsetY;
              
              let cityColor = city.color;
              if (city.ownerId === '0') {
                cityColor = '#999999'; // 未占领的城池为灰色
              } else if (selectedMonarch && city.ownerId === selectedMonarch.id) {
                cityColor = selectedMonarch.cityColor; // 我方城池使用君主颜色
              }
              
              return (
                <TouchableOpacity
                  key={city.id}
                  style={[
                    styles.cityView,
                    {
                      left: x - 15 * scale,
                      top: y - 15 * scale,
                      width: 30 * scale,
                      height: 30 * scale,
                    }
                  ]}
                  onPress={() => setSelectedCity(city)}
                >
                  <View style={[styles.cityCircle, { backgroundColor: cityColor }]} />
                  <View style={[styles.flagPole, { height: 15 * scale }]} />
                  <View style={[styles.flag, { backgroundColor: cityColor }]} />
                  <Text style={[styles.cityName, { fontSize: 12 * scale, top: 25 * scale }]}>
                    {city.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
    backgroundColor: '#f0e6d2', // 宣纸色
  },
  mapView: {
    flex: 1,
    backgroundColor: '#f0e6d2', // 宣纸色
    position: 'relative',
  },
  cityView: {
    position: 'absolute',
    alignItems: 'center',
  },
  cityCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#333',
  },
  flagPole: {
    width: 2,
    backgroundColor: '#8B4513',
    position: 'absolute',
    top: -15,
    left: 14,
  },
  flag: {
    position: 'absolute',
    top: -25,
    left: 16,
    width: 10,
    height: 10,
    transform: [{ rotate: '-45deg' }],
  },
  cityName: {
    position: 'absolute',
    textAlign: 'center',
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666666', // 灰色
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  zoomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // 墨色
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
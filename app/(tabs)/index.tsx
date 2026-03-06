import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 自定义鸟图标组件
const BirdIcon = () => (
  <View style={styles.birdBody}>
    <View style={styles.birdEye} />
    <View style={styles.birdBeak} />
  </View>
);

// 应用图标组件
const AppIcon = ({ app, isDark, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  return (
    <TouchableOpacity
      style={styles.appIconContainer}
      onPressIn={() => {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
          }),
          Animated.spring(translateYAnim, {
            toValue: 2,
            useNativeDriver: true,
          }),
        ]).start();
      }}
      onPressOut={() => {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(translateYAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.appIcon,
          { backgroundColor: app.color + "20" },
          isDark && styles.darkAppIcon,
          styles.appIconShadow,
          {
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: app.color }]}>
          {app.icon === "flappybird" ? (
            <BirdIcon />
          ) : (
            <MaterialIcons name={app.icon as any} size={24} color="#fff" />
          )}
        </View>
      </Animated.View>
      <Text style={[styles.appName, isDark && styles.darkText]}>
        {app.name}
      </Text>
    </TouchableOpacity>
  );
};

// 底部应用图标组件
const BottomAppIcon = ({ app, isDark, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  return (
    <TouchableOpacity
      style={styles.bottomAppItem}
      onPressIn={() => {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
          }),
          Animated.spring(translateYAnim, {
            toValue: 2,
            useNativeDriver: true,
          }),
        ]).start();
      }}
      onPressOut={() => {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(translateYAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.bottomIconContainer,
          { backgroundColor: app.color },
          {
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <MaterialIcons name={app.icon as any} size={20} color="#fff" />
      </Animated.View>
      <Text style={[styles.bottomAppName, isDark && styles.darkText]}>
        {app.name}
      </Text>
    </TouchableOpacity>
  );
};



// 导入xlsx库
import * as XLSX from "xlsx";
import { Asset } from "expo-asset";

// Canvas地图组件
const CanvasMap = ({ cities, isDark, onCityPress, targetCity }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(0.7); // 初始缩放级别调整为0.7，显示更宽敞
  const [position, setPosition] = useState({ x: 100, y: 50 }); // 初始位置调整，让地图居中显示
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const animationRef = useRef(null);

  // 定位到目标城市（带动画效果）
  useEffect(() => {
    if (targetCity) {
      const canvasWidth = 800;
      const canvasHeight = 600;
      const targetScale = 1.5;
      const targetX = canvasWidth / 2 - targetCity.x * targetScale;
      const targetY = canvasHeight / 2 - targetCity.y * targetScale;
      
      // 动画持续时间（毫秒）
      const duration = 1000;
      const startTime = Date.now();
      const startScale = scale;
      const startX = position.x;
      const startY = position.y;
      
      // 清理之前的动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // 动画函数
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数使动画更自然
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        // 计算当前值
        const currentScale = startScale + (targetScale - startScale) * easeOutCubic;
        const currentX = startX + (targetX - startX) * easeOutCubic;
        const currentY = startY + (targetY - startY) * easeOutCubic;
        
        // 更新状态
        setScale(currentScale);
        setPosition({ x: currentX, y: currentY });
        
        // 继续动画
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      // 开始动画
      animationRef.current = requestAnimationFrame(animate);
    }
    
    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetCity]);

  // 绘制地图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 提高Canvas分辨率以支持高清显示
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // 保存原始尺寸
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // 设置Canvas实际尺寸
    canvas.width = originalWidth * devicePixelRatio;
    canvas.height = originalHeight * devicePixelRatio;
    
    // 设置CSS尺寸
    canvas.style.width = originalWidth + 'px';
    canvas.style.height = originalHeight + 'px';
    
    // 缩放上下文以匹配设备像素比
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // 清空画布
    ctx.clearRect(0, 0, originalWidth, originalHeight);

    // 绘制地图背景 - 水墨风格
    ctx.fillStyle = isDark ? '#1a1a1a' : '#f5f5dc';
    ctx.fillRect(0, 0, originalWidth, originalHeight);

    // 添加水墨纹理效果
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * originalWidth, Math.random() * originalHeight, Math.random() * 100 + 50, 0, Math.PI * 2);
      ctx.fill();
    }

    // 应用缩放和位移
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);

    // 移除山水海的绘制，只保留地图背景
    
    // 绘制地图纹理 - 水墨风格
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    for (let i = 0; i < 600; i += 20) {
      for (let j = 0; j < 400; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillRect(i, j, 10, 10);
        }
      }
    }

    // 绘制城市 - 水墨风格与丹青色彩结合，根据缩放级别调整大小
    cities.forEach(city => {
      // 为不同势力使用不同的丹青颜色
      const forceColor = city.color;
      
      // 根据缩放级别调整城市标记大小，进一步限制最大尺寸
      const baseSize = 10; // 减小基础尺寸
      const size = Math.max(6, Math.min(12, baseSize * Math.pow(scale, 0.5))); // 使用平方根函数，让大小增长更缓慢，限制最大尺寸为12
      const haloSize = size * 1.5; // 减小光晕大小
      
      // 绘制城市光晕 - 水墨效果与丹青色彩结合
      const gradient = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, haloSize);
      gradient.addColorStop(0, forceColor + '80');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(city.x, city.y, haloSize, 0, Math.PI * 2);
      ctx.fill();

      // 绘制旗帜 - 水墨风格与丹青色彩结合，根据缩放级别调整大小
      ctx.save();
      const flagHeight = Math.max(20, Math.min(30, 30 * Math.pow(scale, 0.5))); // 使用平方根函数，让大小增长更缓慢，限制最大高度为30
      const flagWidth = Math.max(10, Math.min(15, 15 * Math.pow(scale, 0.5))); // 限制最大宽度为15
      // 旗杆 - 墨色
      ctx.fillStyle = isDark ? '#555' : '#333';
      ctx.fillRect(city.x - 1.5, city.y - flagHeight, 3, flagHeight - 10);
      // 旗帜 - 三角形形状，使用势力的丹青颜色
      ctx.fillStyle = forceColor;
      ctx.beginPath();
      ctx.moveTo(city.x, city.y - flagHeight);
      ctx.lineTo(city.x + flagWidth, city.y - flagHeight + 5);
      ctx.lineTo(city.x, city.y - flagHeight + 10);
      ctx.closePath();
      ctx.fill();
      // 势力名称 - 水墨风格，根据缩放级别调整字体大小
      const forceFontSize = Math.max(5, 6 * Math.min(scale, 1.5));
      ctx.fillStyle = isDark ? '#fff' : '#333';
      ctx.font = `bold ${forceFontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(city.force, city.x + flagWidth / 2, city.y - flagHeight + 5);
      ctx.restore();

      // 绘制城市圆圈 - 水墨风格与丹青色彩结合
      ctx.fillStyle = forceColor;
      ctx.strokeStyle = isDark ? '#fff' : '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(city.x, city.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 绘制城市内部亮点 - 水墨效果
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(city.x - size * 0.25, city.y - size * 0.25, size * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // 绘制城市名称 - 水墨风格，根据缩放级别调整字体大小
      if (scale >= 0.8) { // 只有在缩放级别足够大时才显示城市名称
        const nameFontSize = Math.max(7, 9 * Math.min(scale, 1.5));
        ctx.fillStyle = isDark ? '#fff' : '#333';
        ctx.font = `${nameFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(city.name, city.x, city.y + size + 5);
      }
    });

    ctx.restore();
  }, [cities, isDark, scale, position]);

  // 处理触摸事件
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setLastDistance(Math.sqrt(dx * dx + dy * dy));
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scaleFactor = distance / lastDistance;
      setScale(prev => Math.max(0.5, Math.min(3, prev * scaleFactor)));
      setLastDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 处理鼠标滚轮事件（电脑端）
  const handleWheel = (e) => {
    const mapRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - mapRect.left;
    const mouseY = e.clientY - mapRect.top;
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * scaleFactor));
    
    // 计算鼠标在地图上的相对位置
    const relativeX = (mouseX - position.x) / scale;
    const relativeY = (mouseY - position.y) / scale;
    
    // 计算新的位置，使得鼠标指向的位置保持不变
    const newX = mouseX - relativeX * newScale;
    const newY = mouseY - relativeY * newScale;
    
    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  // 处理鼠标拖动事件（电脑端）
  const handleMouseDown = (e) => {
    setIsMouseDragging(true);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isMouseDragging) {
      const dx = e.clientX - lastMousePosition.x;
      const dy = e.clientY - lastMousePosition.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsMouseDragging(false);
  };

  const handleMouseLeave = () => {
    setIsMouseDragging(false);
  };

  // 处理点击事件
  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;

    for (const city of cities) {
      const dx = x - city.x;
      const dy = y - city.y;
      if (dx * dx + dy * dy <= 10 * 10) {
        onCityPress(city);
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={styles.canvas}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
};

// 三国志游戏组件
const ThreeKingdomsGame = ({ language, isDark }) => {
  // 游戏状态
  const [year, setYear] = useState(187);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forces, setForces] = useState([]);
  const [selectedForce, setSelectedForce] = useState(null);
  const [showForceSelection, setShowForceSelection] = useState(true);
  const [forceCityCounts, setForceCityCounts] = useState({});

  // 从Excel文件读取城市和君主数据
  useEffect(() => {
    const loadExcelData = async () => {
      setLoading(true);
      try {
        // 加载Excel文件
        const response = await fetch('/data/311_data.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        
        // 解析Excel文件
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 读取城市数据和君主数据
        const citySheet = workbook.Sheets['城市'] || workbook.Sheets['cities'];
        const forceSheet = workbook.Sheets['君主表'] || workbook.Sheets['forces'] || workbook.Sheets['lords'];
        
        if (!citySheet || !forceSheet) {
          throw new Error('Excel文件中缺少城市或君主工作表');
        }
        
        // 转换为JSON
        const citiesData = XLSX.utils.sheet_to_json(citySheet);
        const forcesData = XLSX.utils.sheet_to_json(forceSheet);
        
        // 保存君主数据
        setForces(forcesData);
        
        // 创建君主ID到名称的映射
        const forceMap = {};
        forcesData.forEach(force => {
          forceMap[force.id] = force.name;
        });
        
        // 创建君主ID到颜色的映射
        const forceColorMap = {};
        forcesData.forEach(force => {
          forceColorMap[force.id] = force.color || force.Color || "#D32F2F";
        });
        
        // 处理城市数据，使用真实的坐标和颜色
        const processedCities = citiesData.map((city, index) => {
          // 使用城市表中的position_x和position_y作为坐标
          const x = city.position_x || city.position_X || city.PositionX || 50 + (index % 8) * 60;
          const y = city.position_y || city.position_Y || city.PositionY || 50 + Math.floor(index / 8) * 70;
          
          // 获取城市ID
          const cityId = city.id;
          
          // 查找拥有该城市的君主
          let forceId = null;
          let forceName = '';
          let color = "#999999";
          
          for (const force of forcesData) {
            if (force.citys) {
              const cityIds = force.citys.split(',').map(id => id.trim());
              if (cityIds.includes(cityId)) {
                forceId = force.id;
                forceName = force.name;
                color = force[' color'] || force.color || "#D32F2F";
                break;
              }
            }
          }
          
          return {
            id: cityId || index + 1,
            name: city.name || `城市${index + 1}`,
            x,
            y,
            forceId,
            force: forceName,
            color
          };
        });
        
        setCities(processedCities);
        
        // 计算每个君主的城市数量
        const cityCounts = {};
        forcesData.forEach(force => {
          if (force.citys) {
            // 分割城市ID列表并计算数量
            const cityIds = force.citys.split(',').filter(id => id.trim() !== '');
            cityCounts[String(force.id)] = cityIds.length;
          } else {
            cityCounts[String(force.id)] = 0;
          }
        });
        setForceCityCounts(cityCounts);
      } catch (error) {
        console.error('Error loading Excel data:', error);
        // 加载失败时使用默认数据
        const defaultCities = [
          { id: 1, name: "洛阳", x: 200, y: 100, forceId: 1, force: "东汉", color: "#D32F2F" },
          { id: 2, name: "长安", x: 100, y: 120, forceId: 1, force: "东汉", color: "#D32F2F" },
          { id: 3, name: "许昌", x: 220, y: 160, forceId: 1, force: "东汉", color: "#D32F2F" },
          { id: 4, name: "邺城", x: 280, y: 140, forceId: 2, force: "袁绍", color: "#1976D2" },
          { id: 5, name: "宛城", x: 210, y: 200, forceId: 1, force: "东汉", color: "#D32F2F" },
        ];
        setCities(defaultCities);
        
        // 计算默认数据的城市数量
        const defaultCityCounts = {
          1: 4, // 东汉
          2: 1  // 袁绍
        };
        setForceCityCounts(defaultCityCounts);
      } finally {
        setLoading(false);
      }
    };
    
    loadExcelData();
  }, []);

  // 处理君主选择
  const [targetCity, setTargetCity] = useState(null);
  
  const handleForceSelect = (force) => {
    setSelectedForce(force);
    setShowForceSelection(false);
    
    // 找到该君主的第一个城市并定位
    const forceCity = cities.find(city => city.forceId === force.id);
    if (forceCity) {
      setTargetCity(forceCity);
    }
  };

  return (
    <View
      style={[
        styles.threeKingdomsContainer,
        isDark && styles.darkThreeKingdomsContainer,
      ]}
    >
      {/* 游戏标题和时间 */}
      <View style={styles.threeKingdomsHeader}>
        <Text style={[styles.threeKingdomsTitle, isDark && styles.darkText]}>
          {language === "zh"
            ? "三国志·霸王的大陆"
            : "Three Kingdoms·Rise of Heroes"}
        </Text>
        <Text style={[styles.yearText, isDark && styles.darkText]}>
          {language === "zh" ? `年份: ${year}年` : `Year: ${year} AD`}
        </Text>
      </View>

      {/* 大地图 */}
      <View style={styles.mapContainer}>
        <View style={[styles.map, isDark && styles.darkMap]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, isDark && styles.darkText]}>
                {language === "zh"
                  ? "加载城池数据中..."
                  : "Loading city data..."}
              </Text>
            </View>
          ) : (
            <CanvasMap 
              cities={cities} 
              isDark={isDark} 
              onCityPress={setSelectedCity} 
              targetCity={targetCity} 
            />
          )}
        </View>
      </View>

      {/* 城池详情 */}
      {selectedCity && (
        <View style={[styles.cityDetail, isDark && styles.darkCityDetail]}>
          <Text style={[styles.cityDetailTitle, isDark && styles.darkText]}>
            {selectedCity.name}
          </Text>
          <Text style={[styles.cityDetailInfo, isDark && styles.darkText]}>
            {language === "zh"
              ? `势力: ${selectedCity.force}`
              : `Force: ${selectedCity.force}`}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, isDark && styles.darkCloseButton]}
            onPress={() => setSelectedCity(null)}
          >
            <Text style={styles.closeButtonText}>
              {language === "zh" ? "关闭" : "Close"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 控制按钮 */}
      <View style={styles.threeKingdomsControls}>
        <TouchableOpacity
          style={[styles.controlButton, isDark && styles.darkControlButton]}
          onPress={() => setYear((prev) => prev + 1)}
        >
          <Text style={styles.controlButtonText}>
            {language === "zh" ? "下一年" : "Next Year"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, isDark && styles.darkControlButton]}
          onPress={() => setYear(187)}
        >
          <Text style={styles.controlButtonText}>
            {language === "zh" ? "重置" : "Reset"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 君主选择弹窗 */}
      {showForceSelection && !loading && (
        <View style={[styles.forceSelectionModal, isDark && styles.darkForceSelectionModal]}>
          <View style={[styles.forceSelectionContent, isDark && styles.darkForceSelectionContent]}>
            <Text style={[styles.forceSelectionTitle, isDark && styles.darkText]}>
              {language === "zh" ? "选择君主" : "Select Lord"}
            </Text>
            <View style={styles.forceList}>
              {forces.map((force) => {
                // 确保使用字符串类型的君主ID来查找城市数量
                const forceIdStr = String(force.id);
                const cityCount = forceCityCounts[forceIdStr] || 0;
                return (
                  <TouchableOpacity
                    key={force.id}
                    style={[styles.forceItem, isDark && styles.darkForceItem]}
                    onPress={() => handleForceSelect(force)}
                  >
                    <View style={styles.forceFlag}>
                      <View style={[styles.flagPole]} />
                      <View style={[styles.flag, { backgroundColor: force[' color'] || force.color || "#D32F2F" }]} />
                    </View>
                    <View style={styles.forceInfo}>
                      <Text style={[styles.forceName, isDark && styles.darkText]}>
                        {force.name}
                      </Text>
                      <Text style={[styles.forceCityCount, isDark && styles.darkText]}>
                        {language === "zh" ? `城池数量: ${cityCount}` : `Cities: ${cityCount}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const HomeScreen = () => {
  const colorScheme = useColorScheme();
  const [currentTime, setCurrentTime] = useState("");
  const [showApp, setShowApp] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [volume, setVolume] = useState(70);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("zh"); // zh for Chinese, en for English

  // 使用 darkMode 状态来控制主题，而不是系统的 colorScheme
  const isDark = darkMode;

  // 从存储中加载保存的设置
  useEffect(() => {
    const loadSettings = () => {
      try {
        console.log("Loading settings...");

        // 直接使用 localStorage，确保在 web 环境中工作
        const savedLanguage = localStorage.getItem("language");
        const savedDarkMode = localStorage.getItem("darkMode");

        console.log("Saved language:", savedLanguage);
        console.log("Saved dark mode:", savedDarkMode);

        if (savedLanguage) {
          console.log("Setting language to:", savedLanguage);
          setLanguage(savedLanguage);
        }

        if (savedDarkMode) {
          console.log("Setting dark mode to:", savedDarkMode === "true");
          setDarkMode(savedDarkMode === "true");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    // 立即执行加载设置
    loadSettings();
  }, []);

  // 保存语言设置
  useEffect(() => {
    const saveLanguage = () => {
      try {
        console.log("Saving language:", language);
        localStorage.setItem("language", language);
      } catch (error) {
        console.error("Error saving language:", error);
      }
    };

    saveLanguage();
  }, [language]);

  // 保存黑暗模式设置
  useEffect(() => {
    const saveDarkMode = () => {
      try {
        console.log("Saving dark mode:", darkMode);
        localStorage.setItem("darkMode", darkMode.toString());
      } catch (error) {
        console.error("Error saving dark mode:", error);
      }
    };

    saveDarkMode();
  }, [darkMode]);

  // 更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 模拟电池电量变化
  useEffect(() => {
    const interval = setInterval(() => {
      const level = Math.floor(Math.random() * 21) + 80;
      setBatteryLevel(level);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const apps = [
    {
      id: "threekingdoms",
      name: language === "zh" ? "三国志" : "Three Kingdoms",
      icon: "terrain",
      color: "#D32F2F",
    },
    {
      id: "settings",
      name: language === "zh" ? "设置" : "Settings",
      icon: "settings",
      color: "#8E8E93",
    },
  ];

  const bottomApps = [
    {
      id: "wechat",
      name: language === "zh" ? "微信" : "WeChat",
      icon: "chat",
      color: "#07C160",
    },
    {
      id: "phone",
      name: language === "zh" ? "电话" : "Phone",
      icon: "phone",
      color: "#34C759",
    },
    {
      id: "sms",
      name: language === "zh" ? "短信" : "SMS",
      icon: "sms",
      color: "#007AFF",
    },
  ];

  const handleAppPress = (appId: string) => {
    setShowApp(appId === showApp ? null : appId);
  };

  // 监听黑暗模式变化，更新系统主题
  useEffect(() => {
    if (darkMode) {
      // 这里可以添加设置系统黑暗模式的代码
    }
  }, [darkMode]);

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* 状态栏 */}
      <View style={[styles.statusBar, isDark && styles.darkStatusBar]}>
        <Text style={[styles.timeText, isDark && styles.darkText]}>
          {currentTime}
        </Text>
        <View style={styles.statusIcons}>
          <MaterialIcons
            name="signal-cellular-alt"
            size={16}
            color={isDark ? "#fff" : "#000"}
          />
          <MaterialIcons
            name="wifi"
            size={16}
            color={isDark ? "#fff" : "#000"}
            style={styles.statusIcon}
          />
          <MaterialIcons
            name="battery-full"
            size={16}
            color={isDark ? "#fff" : "#000"}
          />
        </View>
      </View>

      {/* 应用图标界面 */}
      {!showApp ? (
        <View style={styles.homeScreen}>
          {/* 应用图标网格 */}
          <View style={[styles.appGrid, styles.centeredAppGrid]}>
            {apps.map((app) => (
              <AppIcon
                key={app.id}
                app={app}
                isDark={isDark}
                onPress={() => handleAppPress(app.id)}
              />
            ))}
          </View>

          {/* 底部常用功能栏 */}
          <View
            style={[
              styles.bottomBar,
              isDark && styles.darkBottomBar,
              styles.bottomBarShadow,
            ]}
          >
            {bottomApps.map((app) => (
              <BottomAppIcon
                key={app.id}
                app={app}
                isDark={isDark}
                onPress={() => handleAppPress(app.id)}
              />
            ))}
          </View>
        </View>
      ) : (
        /* 应用内容 */
        <View style={styles.appContent}>
          {/* 返回按钮 */}
          <TouchableOpacity
            style={[styles.backButton, isDark && styles.darkBackButton]}
            onPress={() => setShowApp(null)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDark ? "#fff" : "#007AFF"}
            />
          </TouchableOpacity>
          {/* 应用内容 */}
          {showApp === "flappybird" && (
            <FlappyBirdGame language={language} isDark={isDark} />
          )}
          {showApp === "threekingdoms" && (
            <ThreeKingdomsGame language={language} isDark={isDark} />
          )}
          {showApp === "settings" && (
            <ScrollView
              style={[
                styles.settingsContainer,
                isDark && styles.darkSettingsContainer,
              ]}
            >
              <View
                style={[
                  styles.settingsSection,
                  isDark && styles.darkSettingsSection,
                ]}
              >
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  {language === "zh" ? "音量控制" : "Volume Control"}
                </Text>
                <View style={styles.volumeControl}>
                  <MaterialIcons
                    name="volume-down"
                    size={24}
                    color={isDark ? "#fff" : "#000"}
                  />
                  <View style={styles.slider}>
                    <Text
                      style={[styles.volumeValue, isDark && styles.darkText]}
                    >
                      {volume}%
                    </Text>
                  </View>
                  <MaterialIcons
                    name="volume-up"
                    size={24}
                    color={isDark ? "#fff" : "#000"}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.settingsSection,
                  isDark && styles.darkSettingsSection,
                ]}
              >
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  {language === "zh" ? "显示设置" : "Display Settings"}
                </Text>
                <View style={styles.settingRow}>
                  <Text
                    style={[styles.settingLabel, isDark && styles.darkText]}
                  >
                    {language === "zh" ? "黑暗模式" : "Dark Mode"}
                  </Text>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: "#e0e0e0", true: "#333" }}
                    thumbColor={darkMode ? "#007AFF" : "#f4f3f4"}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.settingsSection,
                  isDark && styles.darkSettingsSection,
                ]}
              >
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  {language === "zh" ? "语言设置" : "Language Settings"}
                </Text>
                <View
                  style={[
                    styles.languageOptions,
                    isDark && styles.darkLanguageOptions,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      language === "zh" && styles.selectedLanguage,
                      isDark && styles.darkLanguageOption,
                    ]}
                    onPress={() => setLanguage("zh")}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        language === "zh" && styles.selectedLanguageText,
                        isDark && styles.darkText,
                      ]}
                    >
                      中文
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      language === "en" && styles.selectedLanguage,
                      isDark && styles.darkLanguageOption,
                    ]}
                    onPress={() => setLanguage("en")}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        language === "en" && styles.selectedLanguageText,
                        isDark && styles.darkText,
                      ]}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.settingsSection,
                  isDark && styles.darkSettingsSection,
                ]}
              >
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  {language === "zh" ? "存储设置" : "Storage Settings"}
                </Text>
                <View style={styles.settingRow}>
                  <Text
                    style={[styles.settingLabel, isDark && styles.darkText]}
                  >
                    {language === "zh" ? "缓存大小" : "Cache Size"}
                  </Text>
                  <Text style={[styles.aboutText, isDark && styles.darkText]}>
                    128 MB
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.clearCacheButton,
                    isDark && styles.darkClearCacheButton,
                  ]}
                  onPress={() => {
                    // 清除缓存的逻辑
                    alert(language === "zh" ? "缓存已清除" : "Cache cleared");
                  }}
                >
                  <Text style={styles.clearCacheButtonText}>
                    {language === "zh" ? "清除缓存" : "Clear Cache"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.settingsSection,
                  isDark && styles.darkSettingsSection,
                ]}
              >
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                  {language === "zh" ? "关于" : "About"}
                </Text>
                <Text style={[styles.aboutText, isDark && styles.darkText]}>
                  {language === "zh" ? "版本 1.0.0" : "Version 1.0.0"}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  darkStatusBar: {
    backgroundColor: "#1e1e1e",
    borderBottomColor: "#333",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginHorizontal: 8,
  },
  homeScreen: {
    flex: 1,
    padding: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  appGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  appIconContainer: {
    width: "30%",
    alignItems: "center",
    marginBottom: 30,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  darkAppIcon: {
    backgroundColor: "#333",
  },
  appIconShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    borderRadius: 20,
    marginTop: "auto",
  },
  darkBottomBar: {
    backgroundColor: "#1e1e1e",
    borderTopColor: "#333",
  },
  bottomBarShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomAppItem: {
    alignItems: "center",
  },
  bottomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  bottomAppName: {
    fontSize: 12,
    color: "#666",
  },
  appContent: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  darkBackButton: {
    backgroundColor: "#1e1e1e",
    borderBottomColor: "#333",
  },
  centeredAppGrid: {
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  darkSettingsContainer: {
    backgroundColor: "#121212",
  },
  settingsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkSettingsSection: {
    backgroundColor: "#1e1e1e",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  volumeControl: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  volumeValue: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
  },
  languageOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  darkLanguageOptions: {
    borderColor: "#333",
  },
  languageOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  darkLanguageOption: {
    borderColor: "#333",
  },
  selectedLanguage: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  languageText: {
    fontSize: 16,
    color: "#333",
  },
  selectedLanguageText: {
    color: "#fff",
  },
  aboutText: {
    fontSize: 16,
    color: "#666",
  },
  clearCacheButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  darkClearCacheButton: {
    backgroundColor: "#0056b3",
  },
  clearCacheButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // 游戏相关样式
  gameContainer: {
    flex: 1,
    backgroundColor: "#87CEEB",
  },
  darkGameContainer: {
    backgroundColor: "#1a2a3a",
  },
  scoreContainer: {
    paddingTop: 20,
    alignItems: "center",
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  highScoreText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameArea: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#87CEEB",
  },
  ground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "#795548",
  },
  darkGround: {
    backgroundColor: "#5D4037",
  },
  bird: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  birdBody: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFEB3B",
    borderRadius: "50%",
    borderWidth: 2,
    borderColor: "#FFC107",
    position: "relative",
  },
  birdEye: {
    position: "absolute",
    top: 5,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#000",
    borderRadius: "50%",
  },
  birdBeak: {
    position: "absolute",
    top: 12,
    right: -5,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FF9800",
  },
  pipe: {
    position: "absolute",
    backgroundColor: "#2E8B57",
  },
  topPipe: {
    top: 0,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  bottomPipe: {
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  pipeCap: {
    position: "absolute",
    left: -10,
    right: -10,
    height: 20,
    backgroundColor: "#2E8B57",
  },
  topPipeCap: {
    bottom: -20,
  },
  bottomPipeCap: {
    top: -20,
  },
  startScreen: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 20,
    borderRadius: 10,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  startSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  gameOverScreen: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -125 }, { translateY: -100 }],
    width: 250,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 10,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  gameOverScore: {
    fontSize: 20,
    marginBottom: 10,
    color: "#666",
  },
  gameOverHighScore: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  restartButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
  },
  darkRestartButton: {
    backgroundColor: "#388E3C",
  },
  restartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // 三国志游戏相关样式
  threeKingdomsContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  darkThreeKingdomsContainer: {
    backgroundColor: "#121212",
  },
  threeKingdomsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#D32F2F",
  },
  threeKingdomsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  yearText: {
    fontSize: 16,
    color: "#fff",
  },
  mapContainer: {
    flex: 1,
    padding: 10,
  },
  map: {
    flex: 1,
    backgroundColor: '#D2B48C',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  darkMap: {
    backgroundColor: "#8B4513",
  },
  city: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  cityName: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  cityForce: {
    fontSize: 8,
    color: "#fff",
  },
  cityDetail: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    zIndex: 20,
  },
  darkCityDetail: {
    backgroundColor: "rgba(30, 30, 30, 0.9)",
  },
  cityDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  cityDetailInfo: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  closeButton: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 20,
  },
  darkCloseButton: {
    backgroundColor: "#B71C1C",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  threeKingdomsControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "#fff",
  },
  darkThreeKingdomsControls: {
    backgroundColor: "#1e1e1e",
  },
  controlButton: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
  },
  darkControlButton: {
    backgroundColor: "#B71C1C",
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
  },
  flag: {
    position: "absolute",
    width: 20,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
  },
  flagText: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  cityTouchArea: {
    position: "absolute",
    width: 50,
    height: 50,
    zIndex: 10,
  },
  mapContent: {
    width: 800,
    height: 600,
  },
  touchLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 800,
    height: 600,
    zIndex: 10,
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
  mapWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  // 君主选择弹窗样式
  forceSelectionModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  darkForceSelectionModal: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  forceSelectionContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  darkForceSelectionContent: {
    backgroundColor: "#1e1e1e",
  },
  forceSelectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  forceList: {
    maxHeight: "70%",
    overflow: "scroll",
  },
  forceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  darkForceItem: {
    borderBottomColor: "#333",
  },
  forceFlag: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  flagPole: {
    position: "absolute",
    width: 3,
    height: 30,
    backgroundColor: "#333",
    left: 10,
  },
  flag: {
    width: 25,
    height: 15,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginLeft: 10,
  },
  forceInfo: {
    flex: 1,
  },
  forceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  forceCityCount: {
    fontSize: 14,
    color: "#666",
  },
  mapContent: {
    width: 800,
    height: 600,
    position: "relative",
  },
  mapBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 800,
    height: 600,
    backgroundColor: '#D2B48C', // 土黄色，更符合古代地图风格
    borderRadius: 12,
  },
  darkMapBackground: {
    backgroundColor: '#8B4513', // 深棕色，黑暗模式下的地图背景
  },
  cityContainer: {
    position: "absolute",
    width: 40,
    height: 80,
    alignItems: "center",
  },
  flagPole: {
    width: 3,
    height: 30,
    alignSelf: "center",
  },
  flag: {
    width: 18,
    height: 12,
    position: "absolute",
    top: 0,
    left: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  flagText: {
    fontSize: 6,
    color: "#fff",
    fontWeight: "bold",
  },
  cityCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    position: "absolute",
    top: 30,
    left: 10,
  },
  cityName: {
    fontSize: 8,
    color: "#333",
    position: "absolute",
    top: 55,
  },
  darkCityName: {
    color: "#e0e0e0",
  },
});

export default HomeScreen;

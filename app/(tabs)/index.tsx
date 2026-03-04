import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import CalendarScreen from './calendar';
import WeatherScreen from './weather';
import AlbumScreen from './album';

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
          { backgroundColor: app.color + '20' },
          isDark && styles.darkAppIcon,
          styles.appIconShadow,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: app.color }]}>
          <MaterialIcons name={app.icon as any} size={24} color="#fff" />
        </View>
      </Animated.View>
      <Text style={[styles.appName, isDark && styles.darkText]}>{app.name}</Text>
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
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        <MaterialIcons name={app.icon as any} size={20} color="#fff" />
      </Animated.View>
      <Text style={[styles.bottomAppName, isDark && styles.darkText]}>{app.name}</Text>
    </TouchableOpacity>
  );
};

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentTime, setCurrentTime] = useState('');
  const [showApp, setShowApp] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState(100);

  // 更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
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
    { id: 'calendar', name: '日历', icon: 'calendar-today', color: '#007AFF', component: <CalendarScreen /> },
    { id: 'weather', name: '天气', icon: 'wb-sunny', color: '#FF9500', component: <WeatherScreen /> },
    { id: 'album', name: '相册', icon: 'photo', color: '#FF2D55', component: <AlbumScreen /> },
    { id: 'settings', name: '设置', icon: 'settings', color: '#8E8E93' },
    { id: 'clock', name: '时钟', icon: 'access-time', color: '#5856D6' },
    { id: 'notes', name: '备忘录', icon: 'note', color: '#FFCC00' },
  ];

  const bottomApps = [
    { id: 'wechat', name: '微信', icon: 'chat', color: '#07C160' },
    { id: 'phone', name: '电话', icon: 'phone', color: '#34C759' },
    { id: 'sms', name: '短信', icon: 'sms', color: '#007AFF' },
  ];

  const handleAppPress = (appId: string) => {
    setShowApp(appId === showApp ? null : appId);
  };

  const renderApp = () => {
    if (!showApp) return null;
    const app = apps.find(a => a.id === showApp);
    return app?.component || null;
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      {/* 状态栏 */}
      <View style={[styles.statusBar, isDark && styles.darkStatusBar]}>
        <Text style={[styles.timeText, isDark && styles.darkText]}>{currentTime}</Text>
        <View style={styles.statusIcons}>
          <MaterialIcons name="signal-cellular-alt" size={16} color={isDark ? '#fff' : '#000'} />
          <MaterialIcons name="wifi" size={16} color={isDark ? '#fff' : '#000'} style={styles.statusIcon} />
          <MaterialIcons name="battery-full" size={16} color={isDark ? '#fff' : '#000'} />
        </View>
      </View>

      {/* 应用图标界面 */}
      {!showApp ? (
        <View style={styles.homeScreen}>
          {/* 应用图标网格 */}
          <View style={styles.appGrid}>
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
          <View style={[styles.bottomBar, isDark && styles.darkBottomBar, styles.bottomBarShadow]}>
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
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#fff' : '#007AFF'} />
          </TouchableOpacity>
          {/* 应用内容 */}
          {renderApp()}
        </View>
      )}
    </SafeAreaView>
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkStatusBar: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  appIconContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 30,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  darkAppIcon: {
    backgroundColor: '#333',
  },
  appIconShadow: {
    shadowColor: '#000',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderRadius: 20,
    marginTop: 'auto',
  },
  darkBottomBar: {
    backgroundColor: '#1e1e1e',
    borderTopColor: '#333',
  },
  bottomBarShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomAppItem: {
    alignItems: 'center',
  },
  bottomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomAppName: {
    fontSize: 12,
    color: '#666',
  },
  appContent: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkBackButton: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
});

export default HomeScreen;

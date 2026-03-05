import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const [currentTime, setCurrentTime] = useState('');
  const [showApp, setShowApp] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [volume, setVolume] = useState(70);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('zh'); // zh for Chinese, en for English
  
  // 使用 darkMode 状态来控制主题，而不是系统的 colorScheme
  const isDark = darkMode;

  // 从存储中加载保存的设置
  useEffect(() => {
    const loadSettings = () => {
      try {
        console.log('Loading settings...');
        
        // 直接使用 localStorage，确保在 web 环境中工作
        const savedLanguage = localStorage.getItem('language');
        const savedDarkMode = localStorage.getItem('darkMode');
        
        console.log('Saved language:', savedLanguage);
        console.log('Saved dark mode:', savedDarkMode);
        
        if (savedLanguage) {
          console.log('Setting language to:', savedLanguage);
          setLanguage(savedLanguage);
        }
        
        if (savedDarkMode) {
          console.log('Setting dark mode to:', savedDarkMode === 'true');
          setDarkMode(savedDarkMode === 'true');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    // 立即执行加载设置
    loadSettings();
  }, []);

  // 保存语言设置
  useEffect(() => {
    const saveLanguage = () => {
      try {
        console.log('Saving language:', language);
        localStorage.setItem('language', language);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    };
    
    saveLanguage();
  }, [language]);

  // 保存黑暗模式设置
  useEffect(() => {
    const saveDarkMode = () => {
      try {
        console.log('Saving dark mode:', darkMode);
        localStorage.setItem('darkMode', darkMode.toString());
      } catch (error) {
        console.error('Error saving dark mode:', error);
      }
    };
    
    saveDarkMode();
  }, [darkMode]);

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
    { id: 'settings', name: language === 'zh' ? '设置' : 'Settings', icon: 'settings', color: '#8E8E93' },
  ];

  const bottomApps = [
    { id: 'wechat', name: language === 'zh' ? '微信' : 'WeChat', icon: 'chat', color: '#07C160' },
    { id: 'phone', name: language === 'zh' ? '电话' : 'Phone', icon: 'phone', color: '#34C759' },
    { id: 'sms', name: language === 'zh' ? '短信' : 'SMS', icon: 'sms', color: '#007AFF' },
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
          {showApp === 'settings' && (
            <ScrollView style={[styles.settingsContainer, isDark && styles.darkSettingsContainer]}>
              <View style={[styles.settingsSection, isDark && styles.darkSettingsSection]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>{language === 'zh' ? '音量控制' : 'Volume Control'}</Text>
                <View style={styles.volumeControl}>
                  <MaterialIcons 
                    name="volume-down" 
                    size={24} 
                    color={isDark ? '#fff' : '#000'} 
                  />
                  <View style={styles.slider}>
                    <Text style={[styles.volumeValue, isDark && styles.darkText]}>{volume}%</Text>
                  </View>
                  <MaterialIcons 
                    name="volume-up" 
                    size={24} 
                    color={isDark ? '#fff' : '#000'} 
                  />
                </View>
              </View>

              <View style={[styles.settingsSection, isDark && styles.darkSettingsSection]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>{language === 'zh' ? '显示设置' : 'Display Settings'}</Text>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, isDark && styles.darkText]}>{language === 'zh' ? '黑暗模式' : 'Dark Mode'}</Text>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: '#e0e0e0', true: '#333' }}
                    thumbColor={darkMode ? '#007AFF' : '#f4f3f4'}
                  />
                </View>
              </View>

              <View style={[styles.settingsSection, isDark && styles.darkSettingsSection]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>{language === 'zh' ? '语言设置' : 'Language Settings'}</Text>
                <View style={[styles.languageOptions, isDark && styles.darkLanguageOptions]}>
                  <TouchableOpacity 
                    style={[styles.languageOption, language === 'zh' && styles.selectedLanguage, isDark && styles.darkLanguageOption]}
                    onPress={() => setLanguage('zh')}
                  >
                    <Text style={[styles.languageText, language === 'zh' && styles.selectedLanguageText, isDark && styles.darkText]}>中文</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.languageOption, language === 'en' && styles.selectedLanguage, isDark && styles.darkLanguageOption]}
                    onPress={() => setLanguage('en')}
                  >
                    <Text style={[styles.languageText, language === 'en' && styles.selectedLanguageText, isDark && styles.darkText]}>English</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.settingsSection, isDark && styles.darkSettingsSection]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>{language === 'zh' ? '存储设置' : 'Storage Settings'}</Text>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, isDark && styles.darkText]}>{language === 'zh' ? '缓存大小' : 'Cache Size'}</Text>
                  <Text style={[styles.aboutText, isDark && styles.darkText]}>128 MB</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.clearCacheButton, isDark && styles.darkClearCacheButton]}
                  onPress={() => {
                    // 清除缓存的逻辑
                    alert(language === 'zh' ? '缓存已清除' : 'Cache cleared');
                  }}
                >
                  <Text style={styles.clearCacheButtonText}>{language === 'zh' ? '清除缓存' : 'Clear Cache'}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.settingsSection, isDark && styles.darkSettingsSection]}>
                <Text style={[styles.sectionTitle, isDark && styles.darkText]}>{language === 'zh' ? '关于' : 'About'}</Text>
                <Text style={[styles.aboutText, isDark && styles.darkText]}>{language === 'zh' ? '版本 1.0.0' : 'Version 1.0.0'}</Text>
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
  centeredAppGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  darkSettingsContainer: {
    backgroundColor: '#121212',
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkSettingsSection: {
    backgroundColor: '#1e1e1e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  volumeValue: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  languageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  darkLanguageOptions: {
    borderColor: '#333',
  },
  languageOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  darkLanguageOption: {
    borderColor: '#333',
  },
  selectedLanguage: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    color: '#fff',
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
  },
  clearCacheButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  darkClearCacheButton: {
    backgroundColor: '#0056b3',
  },
  clearCacheButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
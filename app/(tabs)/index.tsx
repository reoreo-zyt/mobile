import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

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
          {app.icon === 'flappybird' ? (
            <BirdIcon />
          ) : (
            <MaterialIcons name={app.icon as any} size={24} color="#fff" />
          )}
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

// 跳跃鸟游戏组件
const FlappyBirdGame = ({ language, isDark }) => {
  // 游戏状态
  const [gameState, setGameState] = useState('start'); // start, playing, gameOver
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [birdY, setBirdY] = useState(200);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState([]);
  
  // 游戏常量
  const gameWidth = Dimensions.get('window').width;
  const gameHeight = Dimensions.get('window').height - 100;
  const birdSize = 35;
  const pipeWidth = 70;
  const pipeGap = 140;
  const gravity = 0.5;
  const jumpForce = -9;
  const pipeSpeed = 3;
  const pipeInterval = 1500;
  
  // 游戏循环引用
  const gameLoopId = useRef(null);
  const lastPipeTime = useRef(0);

  // 加载高分
  useEffect(() => {
    try {
      const savedHighScore = localStorage.getItem('flappyBirdHighScore');
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore));
      }
    } catch (error) {
      console.error('Error loading high score:', error);
    }
  }, []);

  // 保存高分
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('flappyBirdHighScore', score.toString());
      } catch (error) {
        console.error('Error saving high score:', error);
      }
    }
  }, [score, highScore]);

  // 键盘事件监听
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space') {
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // 生成管道
  const generatePipe = () => {
    const pipeHeight = Math.random() * (gameHeight - pipeGap - 100) + 50;
    setPipes(prevPipes => [...prevPipes, {
      id: Date.now(),
      x: gameWidth,
      topHeight: pipeHeight,
      scored: false
    }]);
  };

  // 检查碰撞
  const checkCollision = (newY) => {
    const birdX = gameWidth / 4;
    
    // 地面和天花板碰撞
    if (newY < 0 || newY > gameHeight - birdSize - 50) {
      return true;
    }

    // 管道碰撞
    for (let i = 0; i < pipes.length; i++) {
      const pipe = pipes[i];
      if (
        birdX < pipe.x + pipeWidth &&
        birdX + birdSize > pipe.x &&
        (newY < pipe.topHeight || newY + birdSize > pipe.topHeight + pipeGap)
      ) {
        return true;
      }
    }
    
    return false;
  };

  // 游戏主循环
  const gameLoop = () => {
    // 生成新管道
    if (Date.now() - lastPipeTime.current > pipeInterval) {
      generatePipe();
      lastPipeTime.current = Date.now();
    }

    // 更新管道位置和检查得分
    setPipes(prevPipes => {
      const updatedPipes = prevPipes
        .map(pipe => {
          const newPipe = { ...pipe, x: pipe.x - pipeSpeed };
          
          // 检查得分
          if (newPipe.x + pipeWidth < gameWidth / 4 && !newPipe.scored) {
            setScore(prevScore => prevScore + 1);
            newPipe.scored = true;
          }
          
          return newPipe;
        })
        .filter(pipe => pipe.x > -pipeWidth);
      
      // 更新鸟的状态
      const newVelocity = birdVelocity + gravity;
      const newY = birdY + newVelocity;
      
      // 检查碰撞
      const birdX = gameWidth / 4;
      let collision = false;
      
      // 地面和天花板碰撞
      if (newY < 0 || newY > gameHeight - birdSize - 50) {
        collision = true;
      }

      // 管道碰撞
      for (let i = 0; i < updatedPipes.length; i++) {
        const pipe = updatedPipes[i];
        if (
          birdX < pipe.x + pipeWidth &&
          birdX + birdSize > pipe.x &&
          (newY < pipe.topHeight || newY + birdSize > pipe.topHeight + pipeGap)
        ) {
          collision = true;
          break;
        }
      }
      
      // 如果碰撞，结束游戏
      if (collision) {
        setGameState('gameOver');
        if (gameLoopId.current) {
          cancelAnimationFrame(gameLoopId.current);
          gameLoopId.current = null;
        }
      } else {
        // 更新鸟的位置和速度
        setBirdY(newY);
        setBirdVelocity(newVelocity);
      }
      
      return updatedPipes;
    });

    // 继续游戏循环
    if (gameState === 'playing') {
      gameLoopId.current = requestAnimationFrame(gameLoop);
    }
  };

  // 游戏状态变化时的处理
  useEffect(() => {
    if (gameState === 'playing') {
      // 重置游戏状态
      setBirdY(200);
      setBirdVelocity(0);
      setPipes([]);
      lastPipeTime.current = 0;
      
      // 生成第一个管道
      generatePipe();
      lastPipeTime.current = Date.now();
      
      // 开始游戏循环
      gameLoopId.current = requestAnimationFrame(gameLoop);
    } else if (gameState === 'gameOver' || gameState === 'start') {
      // 停止游戏循环
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
        gameLoopId.current = null;
      }
    }

    return () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
      }
    };
  }, [gameState]);

  // 跳跃
  const handleJump = () => {
    if (gameState === 'start') {
      setGameState('playing');
    } else if (gameState === 'playing') {
      setBirdVelocity(jumpForce);
    } else if (gameState === 'gameOver') {
      // 重新开始游戏
      setGameState('start');
      setScore(0);
    }
  };

  return (
    <View style={[styles.gameContainer, isDark && styles.darkGameContainer]}>
      {/* 得分和高分 */}
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, isDark && styles.darkText]}>{score}</Text>
        <Text style={[styles.highScoreText, isDark && styles.darkText]}>
          {language === 'zh' ? `最高分: ${highScore}` : `High Score: ${highScore}`}
        </Text>
      </View>

      {/* 游戏区域 */}
      <TouchableOpacity style={styles.gameArea} activeOpacity={1} onPress={handleJump}>
        {/* 背景 */}
        <View style={styles.background} />
        
        {/* 管道 */}
        {pipes.map((pipe) => (
          <React.Fragment key={pipe.id}>
            {/* 上管道 */}
            <View
              style={[
                styles.pipe,
                styles.topPipe,
                {
                  left: pipe.x,
                  height: pipe.topHeight,
                  width: pipeWidth,
                  position: 'absolute',
                  top: 0
                }
              ]}
            >
              <View style={[styles.pipeCap, styles.topPipeCap]} />
            </View>
            {/* 下管道 */}
            <View
              style={[
                styles.pipe,
                styles.bottomPipe,
                {
                  left: pipe.x,
                  top: pipe.topHeight + pipeGap,
                  height: gameHeight - (pipe.topHeight + pipeGap) - 50,
                  width: pipeWidth,
                  position: 'absolute'
                }
              ]}
            >
              <View style={[styles.pipeCap, styles.bottomPipeCap]} />
            </View>
          </React.Fragment>
        ))}

        {/* 鸟 */}
        <View
          style={[
            styles.bird,
            {
              top: birdY,
              left: gameWidth / 4,
              width: birdSize,
              height: birdSize,
              position: 'absolute',
              zIndex: 10
            }
          ]}
        >
          <View style={styles.birdBody}>
            <View style={styles.birdEye} />
            <View style={styles.birdBeak} />
          </View>
        </View>

        {/* 地面 */}
        <View style={[styles.ground, isDark && styles.darkGround]} />

        {/* 开始界面 */}
        {gameState === 'start' && (
          <View style={styles.startScreen}>
            <Text style={[styles.startTitle, isDark && styles.darkText]}>
              Flappy Bird
            </Text>
            <Text style={[styles.startSubtitle, isDark && styles.darkText]}>
              {language === 'zh' ? '点击屏幕开始游戏' : 'Tap screen to start'}
            </Text>
          </View>
        )}

        {/* 游戏结束界面 */}
        {gameState === 'gameOver' && (
          <View style={styles.gameOverScreen}>
            <Text style={[styles.gameOverTitle, isDark && styles.darkText]}>
              {language === 'zh' ? '游戏结束' : 'Game Over'}
            </Text>
            <Text style={[styles.gameOverScore, isDark && styles.darkText]}>
              {language === 'zh' ? `得分: ${score}` : `Score: ${score}`}
            </Text>
            <Text style={[styles.gameOverHighScore, isDark && styles.darkText]}>
              {language === 'zh' ? `最高分: ${highScore}` : `High Score: ${highScore}`}
            </Text>
            <TouchableOpacity
              style={[styles.restartButton, isDark && styles.darkRestartButton]}
              onPress={handleJump}
            >
              <Text style={styles.restartButtonText}>
                {language === 'zh' ? '重新开始' : 'Restart'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
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
    { id: 'flappybird', name: language === 'zh' ? '跳跃鸟' : 'Flappy Bird', icon: 'flappybird', color: '#FFEB3B' },
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
          {showApp === 'flappybird' && (
            <FlappyBirdGame language={language} isDark={isDark} />
          )}
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
  // 游戏相关样式
  gameContainer: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  darkGameContainer: {
    backgroundColor: '#1a2a3a',
  },
  scoreContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  highScoreText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#87CEEB',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#795548',
  },
  darkGround: {
    backgroundColor: '#5D4037',
  },
  bird: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  birdBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFEB3B',
    borderRadius: '50%',
    borderWidth: 2,
    borderColor: '#FFC107',
    position: 'relative',
  },
  birdEye: {
    position: 'absolute',
    top: 5,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#000',
    borderRadius: '50%',
  },
  birdBeak: {
    position: 'absolute',
    top: 12,
    right: -5,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FF9800',
  },
  pipe: {
    position: 'absolute',
    backgroundColor: '#2E8B57',
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
    position: 'absolute',
    left: -10,
    right: -10,
    height: 20,
    backgroundColor: '#2E8B57',
  },
  topPipeCap: {
    bottom: -20,
  },
  bottomPipeCap: {
    top: -20,
  },
  startScreen: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  startSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  gameOverScreen: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -125 }, { translateY: -100 }],
    width: 250,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  gameOverScore: {
    fontSize: 20,
    marginBottom: 10,
    color: '#666',
  },
  gameOverHighScore: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
  },
  darkRestartButton: {
    backgroundColor: '#388E3C',
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
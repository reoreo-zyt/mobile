import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';

const GameScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [language, setLanguage] = useState('zh'); // zh: 中文, en: 英文

  const translations = {
    zh: {
      title: '三国志霸王的大陆',
      startGame: '开始游戏',
      loadGame: '载入存档',
      settings: '设置',
      exitGame: '退出游戏',
      selectSave: '选择存档',
      cancel: '取消',
      saveSlot: '存档',
      darkMode: '暗色模式',
      language: '语言',
      chinese: '中文',
      english: '英文',
    },
    en: {
      title: 'Romance of the Three Kingdoms: Overlord of the Continent',
      startGame: 'Start Game',
      loadGame: 'Load Game',
      settings: 'Settings',
      exitGame: 'Exit Game',
      selectSave: 'Select Save',
      cancel: 'Cancel',
      saveSlot: 'Save',
      darkMode: 'Dark Mode',
      language: 'Language',
      chinese: 'Chinese',
      english: 'English',
    },
  };

  const t = translations[language];

  const handleStartGame = () => {
    setShowSaveModal(true);
  };

  const handleLoadGame = () => {
    // 实现载入存档功能
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleExitGame = () => {
    // 实现退出游戏功能
  };

  const handleSelectSave = (saveSlot: number) => {
    setShowSaveModal(false);
    router.push('/game/select-monarch');
  };

  const handleDarkModeToggle = (value: boolean) => {
    setIsDarkMode(value);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Text style={[styles.title, isDarkMode && styles.darkTitle]}>{t.title}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, isDarkMode && styles.darkButton]} onPress={handleStartGame}>
          <Text style={[styles.buttonText, isDarkMode && styles.darkButtonText]}>{t.startGame}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, isDarkMode && styles.darkButton]} onPress={handleLoadGame}>
          <Text style={[styles.buttonText, isDarkMode && styles.darkButtonText]}>{t.loadGame}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, isDarkMode && styles.darkButton]} onPress={handleSettings}>
          <Text style={[styles.buttonText, isDarkMode && styles.darkButtonText]}>{t.settings}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, isDarkMode && styles.darkButton]} onPress={handleExitGame}>
          <Text style={[styles.buttonText, isDarkMode && styles.darkButtonText]}>{t.exitGame}</Text>
        </TouchableOpacity>
      </View>

      {/* 存档选择弹窗 */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>{t.selectSave}</Text>
            <ScrollView>
              {[1, 2, 3, 4, 5].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.saveSlot, isDarkMode && styles.darkSaveSlot]}
                  onPress={() => handleSelectSave(slot)}
                >
                  <Text style={[styles.saveSlotText, isDarkMode && styles.darkSaveSlotText]}>{t.saveSlot} {slot}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalButton, isDarkMode && styles.darkModalButton]} onPress={() => setShowSaveModal(false)}>
              <Text style={[styles.modalButtonText, isDarkMode && styles.darkModalButtonText]}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 设置弹窗 */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>{t.settings}</Text>
            
            {/* 暗色模式开关 */}
            <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>{t.darkMode}</Text>
              <Switch
                value={isDarkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#d4d4d0', true: '#5c8a76' }}
                thumbColor={isDarkMode ? '#e0e0d8' : '#ffffff'}
              />
            </View>
            
            {/* 语言切换 */}
            <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>{t.language}</Text>
              <View style={styles.languageButtons}>
                <TouchableOpacity
                  style={[
                    styles.languageButton, 
                    language === 'zh' && (isDarkMode ? styles.darkActiveLanguageButton : styles.activeLanguageButton), 
                    isDarkMode && styles.darkLanguageButton
                  ]}
                  onPress={() => handleLanguageChange('zh')}
                >
                  <Text style={[
                    styles.languageButtonText, 
                    language === 'zh' && (isDarkMode ? styles.darkActiveLanguageButtonText : styles.activeLanguageButtonText), 
                    isDarkMode && styles.darkLanguageButtonText
                  ]}>
                    {t.chinese}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageButton, 
                    language === 'en' && (isDarkMode ? styles.darkActiveLanguageButton : styles.activeLanguageButton), 
                    isDarkMode && styles.darkLanguageButton
                  ]}
                  onPress={() => handleLanguageChange('en')}
                >
                  <Text style={[
                    styles.languageButtonText, 
                    language === 'en' && (isDarkMode ? styles.darkActiveLanguageButtonText : styles.activeLanguageButtonText), 
                    isDarkMode && styles.darkLanguageButtonText
                  ]}>
                    {t.english}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity style={[styles.modalButton, isDarkMode && styles.darkModalButton]} onPress={() => setShowSettingsModal(false)}>
              <Text style={[styles.modalButtonText, isDarkMode && styles.darkModalButtonText]}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f0', // 宣纸白
  },
  darkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // 墨黑
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c2c2c', // 墨色
    marginBottom: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  darkTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e0e0d8', // 宣纸白
    marginBottom: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '80%',
  },
  button: {
    backgroundColor: '#ffffff', // 白色
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
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
  darkButton: {
    backgroundColor: '#2a2a2a', // 深灰色
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a', // 灰色
  },
  buttonText: {
    color: '#2c2c2c', // 墨色
    fontSize: 18,
    fontWeight: 'bold',
  },
  darkButtonText: {
    color: '#e0e0d8', // 宣纸白
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff', // 白色
    borderRadius: 10,
    padding: 20,
    width: '80%',
    borderWidth: 1,
    borderColor: '#d4d4d0', // 浅灰色
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: '#2a2a2a', // 深灰色
    borderRadius: 10,
    padding: 20,
    width: '80%',
    borderWidth: 1,
    borderColor: '#3a3a3a', // 灰色
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c', // 墨色
    marginBottom: 20,
    textAlign: 'center',
  },
  darkModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0e0d8', // 宣纸白
    marginBottom: 20,
    textAlign: 'center',
  },
  saveSlot: {
    backgroundColor: '#f0f0e8', // 浅米色
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d4d4d0', // 浅灰色
  },
  darkSaveSlot: {
    backgroundColor: '#3a3a3a', // 灰色
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4a4a4a', // 深灰色
  },
  saveSlotText: {
    color: '#2c2c2c', // 墨色
    fontSize: 16,
  },
  darkSaveSlotText: {
    color: '#e0e0d8', // 宣纸白
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#f0f0e8', // 浅米色
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4d4d0', // 浅灰色
  },
  darkModalButton: {
    backgroundColor: '#3a3a3a', // 灰色
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a4a4a', // 深灰色
  },
  modalButtonText: {
    color: '#2c2c2c', // 墨色
    fontSize: 16,
  },
  darkModalButtonText: {
    color: '#e0e0d8', // 宣纸白
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d0', // 浅灰色
  },
  darkSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a4a', // 深灰色
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c2c2c', // 墨色
  },
  darkSettingLabel: {
    fontSize: 16,
    color: '#e0e0d8', // 宣纸白
  },
  languageButtons: {
    flexDirection: 'row',
  },
  languageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0e8', // 浅米色
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#d4d4d0', // 浅灰色
  },
  darkLanguageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#3a3a3a', // 灰色
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#4a4a4a', // 深灰色
  },
  activeLanguageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#8b4513', // 棕色
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#654321', // 深棕色
  },
  darkActiveLanguageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#5c8a76', // 青绿色
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#4a7a66', // 深青绿色
  },
  languageButtonText: {
    color: '#2c2c2c', // 墨色
    fontSize: 14,
  },
  darkLanguageButtonText: {
    color: '#e0e0d8', // 宣纸白
    fontSize: 14,
  },
  activeLanguageButtonText: {
    color: '#ffffff', // 白色
    fontWeight: 'bold',
    fontSize: 14,
  },
  darkActiveLanguageButtonText: {
    color: '#0a0a0a', // 墨黑
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default GameScreen;
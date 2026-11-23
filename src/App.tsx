/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QuizSet, GameSettings, AppScreen } from './types';
import { DEFAULT_QUIZ_SETS, DEFAULT_SETTINGS } from './utils/defaults';
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { TeacherSettings } from './components/TeacherSettings';
import { sounds } from './utils/audio';

const STORAGE_KEY_QUIZ_SETS = 'edupose_quiz_sets_v2';
const STORAGE_KEY_ACTIVE_SET = 'edupose_active_set_id_v2';
const STORAGE_KEY_SETTINGS = 'edupose_game_settings_v2';

export default function App() {
  // Load Quiz Sets from localStorage or default
  const [quizSets, setQuizSets] = useState<QuizSet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUIZ_SETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_QUIZ_SETS;
  });

  // Active selected Quiz Set
  const [activeQuizSetId, setActiveQuizSetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_SET);
      if (saved && quizSets.some((s) => s.id === saved)) return saved;
    } catch {}
    return quizSets[0]?.id || DEFAULT_QUIZ_SETS[0].id;
  });

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Sound state
  const [soundOn, setSoundOn] = useState<boolean>(settings.soundEnabled);
  useEffect(() => {
    sounds.enabled = soundOn;
  }, [soundOn]);

  // Screen state: 'home' by default as requested
  const [screen, setScreen] = useState<AppScreen>('home');

  // Persistence handlers
  const handleSaveQuizSets = (newSets: QuizSet[]) => {
    setQuizSets(newSets);
    try {
      localStorage.setItem(STORAGE_KEY_QUIZ_SETS, JSON.stringify(newSets));
    } catch {}
  };

  const handleSelectQuizSet = (id: string) => {
    setActiveQuizSetId(id);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SET, id);
    } catch {}
  };

  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setSoundOn(newSettings.soundEnabled);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch {}
  };

  const currentQuizSet = quizSets.find((s) => s.id === activeQuizSetId) || quizSets[0];

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden selection:bg-pink-400 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]"
      style={{
        backgroundColor: '#fff0f5',
        backgroundImage: settings.customImages.bg
          ? `radial-gradient(rgba(255, 240, 245, 0.75), rgba(255, 240, 245, 0.95)), url(${settings.customImages.bg})`
          : 'radial-gradient(ellipse at 50% 0%, #ffe4ec 0%, #fff0f5 75%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {screen === 'home' && (
        <HomeScreen
          quizSets={quizSets}
          activeQuizSetId={activeQuizSetId}
          onSelectQuizSet={handleSelectQuizSet}
          onStartGame={() => setScreen('game')}
          onOpenSettings={() => setScreen('settings')}
          settings={settings}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(!soundOn)}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          questions={currentQuizSet.questions}
          quizSetTitle={currentQuizSet.title}
          settings={settings}
          onOpenSettings={() => setScreen('settings')}
          onBackToHome={() => setScreen('home')}
        />
      )}

      {screen === 'settings' && (
        <TeacherSettings
          quizSets={quizSets}
          activeQuizSetId={activeQuizSetId}
          settings={settings}
          onSaveQuizSets={handleSaveQuizSets}
          onSelectQuizSet={handleSelectQuizSet}
          onSaveSettings={handleSaveSettings}
          onStartGame={() => setScreen('game')}
          onBackToHome={() => setScreen('home')}
        />
      )}
    </div>
  );
}

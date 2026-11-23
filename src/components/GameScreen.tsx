import React, { useState, useEffect, useRef } from 'react';
import { Question, GameSettings, OptionKey, GestureType, DetectionResult } from '../types';
import { GESTURE_LABELS } from '../utils/defaults';
import { ChibiAvatar } from './ChibiAvatars';
import { PoseDetector } from '../utils/poseDetection';
import { sounds } from '../utils/audio';
import { triggerCorrectFireworks, triggerGrandFinaleFireworks } from '../utils/confettiFireworks';
import { 
  Home, 
  Settings, 
  Volume2, 
  VolumeX, 
  Music,
  Maximize2, 
  Minimize2, 
  Clock, 
  Award, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  Heart,
  GraduationCap,
  AlertCircle
} from 'lucide-react';

interface GameScreenProps {
  questions: Question[];
  quizSetTitle?: string;
  settings: GameSettings;
  onOpenSettings: () => void;
  onBackToHome: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  questions,
  quizSetTitle = 'Bộ Đề Trắc Nghiệm',
  settings,
  onOpenSettings,
  onBackToHome,
}) => {
  // Navigation & Game State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'summary'>('playing');

  // Question Timer
  const [timeLeft, setTimeLeft] = useState(settings.defaultTimeLimit);
  const timerRef = useRef<any>(null);

  // Audio state
  const [soundOn, setSoundOn] = useState(settings.soundEnabled);
  const [bgmOn, setBgmOn] = useState(true);

  useEffect(() => {
    sounds.sfxEnabled = soundOn;
  }, [soundOn]);

  useEffect(() => {
    if (bgmOn) {
      sounds.startBgm();
    } else {
      sounds.stopBgm();
    }

    return () => {
      sounds.stopBgm();
    };
  }, [bgmOn]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Answer selection & evaluation state
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [holdingGesture, setHoldingGesture] = useState<GestureType>('none');
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%

  // Camera & Detection state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedGesture, setDetectedGesture] = useState<GestureType>('none');

  const currentQuestion = questions[currentIndex] || questions[0];

  // Critical Mutable Refs to completely prevent Stale Closure in 30 FPS camera loop
  const holdingGestureRef = useRef<GestureType>('none');
  const holdStartTimeRef = useRef<number | null>(null);
  const lastDetectedGestureRef = useRef<GestureType>('none');
  const lastGestureTimestampRef = useRef<number>(0);
  const hasTriggeredRef = useRef<boolean>(false);
  const gameStateRef = useRef<'playing' | 'feedback' | 'summary'>('playing');
  const currentQuestionRef = useRef<Question>(currentQuestion);
  const settingsRef = useRef<GameSettings>(settings);
  const handlePoseResultRef = useRef<(result: DetectionResult) => void>(() => {});

  // Keep refs synchronized on every single render
  gameStateRef.current = gameState;
  currentQuestionRef.current = currentQuestion;
  settingsRef.current = settings;

  // Initialize Camera & Pose Detection
  useEffect(() => {
    let detector: PoseDetector | null = null;
    const initCamera = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      detector = new PoseDetector();
      const success = await detector.initialize(
        videoRef.current,
        canvasRef.current,
        (result: DetectionResult) => {
          if (handlePoseResultRef.current) {
            handlePoseResultRef.current(result);
          }
        },
        (error: string) => {
          setCameraError(error);
          setCameraReady(false);
        }
      );

      if (success) {
        detectorRef.current = detector;
        setCameraReady(true);
        setCameraError(null);
      }
    };

    initCamera();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
        detectorRef.current = null;
      }
    };
  }, []);

  // Handle Question Timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(timerRef.current);
      return;
    }

    const qTime = currentQuestion?.timeLimit || settings.defaultTimeLimit;
    setTimeLeft(qTime);
    hasTriggeredRef.current = false;
    holdingGestureRef.current = 'none';
    holdStartTimeRef.current = null;
    lastDetectedGestureRef.current = 'none';
    setSelectedOption(null);
    setIsCorrectAnswer(null);
    setHoldingGesture('none');
    setHoldProgress(0);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        if (prev <= 4) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, gameState]);

  const handleTimeOut = () => {
    if (gameStateRef.current !== 'playing' || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    sounds.playWrong();
    setIsCorrectAnswer(false);
    setWrongCount((c) => c + 1);
    setGameState('feedback');
    gameStateRef.current = 'feedback';

    setTimeout(() => {
      advanceNextQuestion();
    }, 2200);
  };

  // Real-time gesture processing & holding logic
  const handlePoseResult = (result: DetectionResult) => {
    const rawGesture = result.detectedGesture;
    const now = Date.now();

    // 180ms grace period so 1-2 noisy frames don't immediately cancel holding progress
    let gesture = rawGesture;
    if (rawGesture !== 'none') {
      lastDetectedGestureRef.current = rawGesture;
      lastGestureTimestampRef.current = now;
    } else {
      if (now - lastGestureTimestampRef.current < 180 && lastDetectedGestureRef.current !== 'none') {
        gesture = lastDetectedGestureRef.current;
      }
    }

    setDetectedGesture(gesture);

    if (gameStateRef.current !== 'playing' || hasTriggeredRef.current) {
      holdingGestureRef.current = 'none';
      holdStartTimeRef.current = null;
      setHoldingGesture('none');
      setHoldProgress(0);
      return;
    }

    const mappedOption = getOptionFromGesture(gesture);

    if (gesture === 'none' || !mappedOption) {
      holdingGestureRef.current = 'none';
      holdStartTimeRef.current = null;
      setHoldingGesture('none');
      setHoldProgress(0);
      return;
    }

    // New gesture detected or switching gesture
    if (holdingGestureRef.current !== gesture) {
      holdingGestureRef.current = gesture;
      holdStartTimeRef.current = now;
      setHoldingGesture(gesture);
      setHoldProgress(10);
    } else if (holdStartTimeRef.current) {
      // Continuing to hold the current gesture!
      const elapsed = (now - holdStartTimeRef.current) / 1000;
      const targetTime = settingsRef.current.holdDuration || 0.8;
      const progress = Math.min(100, Math.round((elapsed / targetTime) * 100));
      setHoldProgress(progress);

      // Play soft rising bubble pop as student holds gesture
      if (progress > 0 && progress < 100 && progress % 25 === 0) {
        sounds.playHoldTick(progress);
      }

      // Time threshold reached: LOCK IN ANSWER AUTOMATICALLY!
      if (elapsed >= targetTime && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        sounds.playLock();
        triggerAnswer(mappedOption);
      }
    }
  };

  handlePoseResultRef.current = handlePoseResult;

  const getOptionFromGesture = (gesture: GestureType): OptionKey | null => {
    const mapping = settingsRef.current.gestureMapping;
    for (const opt of ['A', 'B', 'C', 'D'] as OptionKey[]) {
      if (mapping[opt] === gesture) {
        return opt;
      }
    }
    return null;
  };

  // Keyboard test shortcuts (1/A, 2/B, 3/C, 4/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing' || hasTriggeredRef.current) return;
      const key = e.key.toUpperCase();
      let opt: OptionKey | null = null;
      if (key === '1' || key === 'A') opt = 'A';
      else if (key === '2' || key === 'B') opt = 'B';
      else if (key === '3' || key === 'C') opt = 'C';
      else if (key === '4' || key === 'D') opt = 'D';

      if (opt) {
        hasTriggeredRef.current = true;
        sounds.playLock();
        triggerAnswer(opt);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Evaluate answer
  const triggerAnswer = (opt: OptionKey) => {
    hasTriggeredRef.current = true;
    setSelectedOption(opt);
    clearInterval(timerRef.current);

    const activeQ = currentQuestionRef.current;
    const isCorrect = opt === activeQ.correctAnswer;
    setIsCorrectAnswer(isCorrect);
    setGameState('feedback');
    gameStateRef.current = 'feedback';

    if (isCorrect) {
      const pts = activeQ.points || settingsRef.current.defaultPoints;
      setScore((s) => s + pts);
      setCorrectCount((c) => c + 1);
      sounds.playCorrect();

      // Trigger celebratory multi-burst confetti fireworks!
      if (settingsRef.current.celebrationEnabled) {
        triggerCorrectFireworks();
      }

      setTimeout(() => {
        advanceNextQuestion();
      }, 2000);
    } else {
      setWrongCount((c) => c + 1);
      sounds.playWrong();

      if (settingsRef.current.onWrongAnswer === 'retry') {
        setTimeout(() => {
          hasTriggeredRef.current = false;
          holdingGestureRef.current = 'none';
          holdStartTimeRef.current = null;
          lastDetectedGestureRef.current = 'none';
          setSelectedOption(null);
          setIsCorrectAnswer(null);
          setHoldingGesture('none');
          setHoldProgress(0);
          gameStateRef.current = 'playing';
          setGameState('playing');
        }, 1600);
      } else {
        setTimeout(() => {
          advanceNextQuestion();
        }, 2200);
      }
    }
  };

  const advanceNextQuestion = () => {
    hasTriggeredRef.current = false;
    holdingGestureRef.current = 'none';
    holdStartTimeRef.current = null;
    lastDetectedGestureRef.current = 'none';
    setSelectedOption(null);
    setIsCorrectAnswer(null);
    setHoldingGesture('none');
    setHoldProgress(0);

    if (currentIndex + 1 < questions.length) {
      gameStateRef.current = 'playing';
      setCurrentIndex((i) => i + 1);
      setGameState('playing');
    } else {
      gameStateRef.current = 'summary';
      setGameState('summary');
      sounds.playFanfare();
      if (settingsRef.current.celebrationEnabled) {
        triggerGrandFinaleFireworks();
      }
    }
  };

  const handleRestart = () => {
    hasTriggeredRef.current = false;
    holdingGestureRef.current = 'none';
    holdStartTimeRef.current = null;
    lastDetectedGestureRef.current = 'none';
    setSelectedOption(null);
    setIsCorrectAnswer(null);
    setHoldingGesture('none');
    setHoldProgress(0);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    gameStateRef.current = 'playing';
    setGameState('playing');
  };

  const totalTime = currentQuestion?.timeLimit || settings.defaultTimeLimit;
  const timePercentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  return (
    <div className="relative w-full max-w-[1600px] min-h-screen mx-auto flex flex-col justify-between p-3 md:p-6 select-none overflow-x-hidden">
      {/* Background ambient lighting - Cute Pink & White */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl"></div>
      </div>

      {/* TOP HEADER BAR (Stitched White-Pink Card) */}
      <header className="relative z-10 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 rounded-3xl bg-white/95 border-2 border-dashed border-pink-300 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold transition-all border-2 border-dashed border-pink-200"
            title="Quay lại Trang Chủ"
          >
            <Home className="w-4 h-4 text-pink-500" />
            <span className="hidden sm:inline">Trang Chủ</span>
          </button>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l-2 border-dashed border-pink-200">
            <span className="text-xs font-black text-pink-900 max-w-[200px] truncate">
              {quizSetTitle}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-dashed border-pink-300">
            <GraduationCap className="w-3.5 h-3.5 text-pink-500" />
            <span>Thầy Trần Hồng Quân</span>
          </div>
        </div>

        {/* Center Progress & Score Indicators */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Tiến độ:</span>
            <span className="px-3.5 py-1 rounded-2xl bg-pink-100 text-pink-800 font-black text-xs sm:text-sm border-2 border-dashed border-pink-300 shadow-sm">
              CÂU {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Tổng điểm:</span>
            <span className="px-4 py-1 rounded-2xl bg-rose-100 text-rose-700 font-black text-sm sm:text-base border-2 border-dashed border-rose-300 shadow-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>{score}</span>
            </span>
          </div>
        </div>

        {/* Right Controls (BGM, SFX, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Cute BGM Music Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setBgmOn(!bgmOn);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 border-dashed transition-all shadow-sm ${
              bgmOn
                ? 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200'
                : 'bg-slate-100 text-slate-400 border-slate-300 hover:text-slate-600'
            }`}
            title={bgmOn ? 'Tắt nhạc nền dễ thương' : 'Bật nhạc nền dễ thương'}
          >
            <Music className={`w-4 h-4 ${bgmOn ? 'text-pink-600 animate-wiggle' : 'text-slate-400'}`} />
            <span className="text-[11px] font-bold hidden sm:inline">{bgmOn ? 'Nhạc nền: Bật' : 'Nhạc: Tắt'}</span>
          </button>

          {/* SFX Sound Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setSoundOn(!soundOn);
            }}
            className={`p-2 rounded-2xl border-2 border-dashed transition-all shadow-sm ${
              soundOn
                ? 'bg-pink-100 text-pink-600 border-pink-300 hover:bg-pink-200'
                : 'bg-slate-100 text-slate-400 border-slate-300 hover:text-slate-600'
            }`}
            title={soundOn ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 border-2 border-dashed border-pink-200 transition-all shadow-sm"
            title="Chế độ toàn màn hình máy chiếu"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN PLAY AREA */}
      {gameState !== 'summary' ? (
        <main className="relative z-10 flex-1 flex flex-col justify-between my-3 gap-3 md:gap-4">
          {/* QUESTION BOX (Stitched White Card) */}
          <section className="relative w-full rounded-3xl bg-white border-2 border-dashed border-pink-300 p-5 md:p-6 shadow-sm flex flex-col items-center text-center">
            {/* Question kicker */}
            <div className="flex items-center gap-3 mb-1.5">
              <span className="px-3 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-black tracking-wider uppercase border border-dashed border-pink-300 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                CÂU HỎI {currentIndex + 1}
              </span>
              <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                ★ {currentQuestion.points} điểm
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-pink-950 leading-relaxed max-w-4xl tracking-tight font-['Comfortaa',sans-serif]">
              {currentQuestion.text}
            </h2>

            {/* Optional Question Image */}
            {currentQuestion.image && (
              <div className="mt-3 max-h-36 rounded-2xl overflow-hidden border-2 border-dashed border-pink-300 shadow-sm">
                <img
                  src={currentQuestion.image}
                  alt="Minh họa câu hỏi"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Countdown Candy Timer Bar */}
            <div className="w-full max-w-xl mt-3">
              <div className="flex justify-between items-center text-xs mb-1 px-1">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-pink-500" /> Thời gian suy nghĩ
                </span>
                <span className={`font-mono font-black text-sm ${timeLeft <= 4 ? 'text-rose-600 animate-pulse' : 'text-pink-600'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-pink-100 border border-dashed border-pink-300 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    timeLeft <= 4
                      ? 'bg-gradient-to-r from-red-500 to-rose-600'
                      : 'bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500'
                  }`}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
            </div>
          </section>

          {/* INTERACTIVE STAGE: LEFT OPTIONS | CENTER CAMERA | RIGHT OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
            {/* LEFT SIDE (Option A - Top Left, Option C - Bottom Left) */}
            <div className="md:col-span-3 flex flex-col gap-3 md:gap-4">
              {/* OPTION A */}
              <CuteAnswerCard
                optionKey="A"
                text={currentQuestion.options.A}
                image={currentQuestion.optionImages?.A}
                gesture={settings.gestureMapping.A}
                isHolding={holdingGesture === settings.gestureMapping.A}
                holdProgress={holdProgress}
                isSelected={selectedOption === 'A'}
                isCorrectAnswer={currentQuestion.correctAnswer === 'A'}
                showResult={gameState === 'feedback'}
                onClick={() => {
                  if (gameState === 'playing' && !hasTriggeredRef.current) {
                    sounds.playLock();
                    triggerAnswer('A');
                  }
                }}
              />

              {/* OPTION C */}
              <CuteAnswerCard
                optionKey="C"
                text={currentQuestion.options.C}
                image={currentQuestion.optionImages?.C}
                gesture={settings.gestureMapping.C}
                isHolding={holdingGesture === settings.gestureMapping.C}
                holdProgress={holdProgress}
                isSelected={selectedOption === 'C'}
                isCorrectAnswer={currentQuestion.correctAnswer === 'C'}
                showResult={gameState === 'feedback'}
                onClick={() => {
                  if (gameState === 'playing' && !hasTriggeredRef.current) {
                    sounds.playLock();
                    triggerAnswer('C');
                  }
                }}
              />
            </div>

            {/* CENTER WEBCAM & SKELETON POSE VIEWPORT */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-dashed border-pink-400 bg-slate-900 shadow-xl flex items-center justify-center">
                {/* Real Webcam video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${settings.cameraMirrored ? 'mirror-mode' : ''}`}
                />

                {/* Real-time neon skeleton drawing canvas */}
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={375}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${settings.cameraMirrored ? 'mirror-mode' : ''}`}
                />

                {/* Status Indicator Pill */}
                <div className="absolute top-3 px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md border-2 border-dashed border-pink-300 text-xs font-bold text-pink-700 shadow-sm flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
                  <span>
                    {detectedGesture !== 'none'
                      ? `Nhận diện: ${GESTURE_LABELS[detectedGesture]?.title || detectedGesture}`
                      : 'Đang quan sát cử chỉ học sinh'}
                  </span>
                </div>

                {/* Hold Progress Bar Overlay */}
                {holdingGesture !== 'none' && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border-2 border-dashed border-pink-400 shadow-lg animate-in fade-in">
                    <div className="flex justify-between items-center text-xs font-black text-pink-900 mb-1.5">
                      <span className="flex items-center gap-1.5 text-pink-700">
                        <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin-slow" />
                        Đang giữ: {GESTURE_LABELS[holdingGesture]?.title}
                      </span>
                      <span className="font-mono text-rose-600">{holdProgress}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-pink-100 overflow-hidden border border-dashed border-pink-300">
                      <div
                        className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 transition-all duration-75 shadow-sm"
                        style={{ width: `${holdProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error overlay if camera denied */}
                {cameraError && (
                  <div className="absolute inset-0 bg-pink-950/90 flex flex-col items-center justify-center p-6 text-center text-white">
                    <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-sm font-bold mb-1">Chưa mở được Camera</p>
                    <p className="text-xs text-pink-200 max-w-xs mb-3">{cameraError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-1.5 rounded-2xl bg-white text-pink-700 font-extrabold text-xs shadow-sm"
                    >
                      Tải lại trang & Cấp quyền
                    </button>
                  </div>
                )}
              </div>

              {/* Instructional Footer Under Camera */}
              <div className="mt-2 text-center text-xs text-pink-700/90 font-bold">
                <span>Đứng cách camera 1.5 - 2m · Giữ đúng cử chỉ {settings.holdDuration}s để xác nhận</span>
              </div>
            </div>

            {/* RIGHT SIDE (Option B - Top Right, Option D - Bottom Right) */}
            <div className="md:col-span-3 flex flex-col gap-3 md:gap-4">
              {/* OPTION B */}
              <CuteAnswerCard
                optionKey="B"
                text={currentQuestion.options.B}
                image={currentQuestion.optionImages?.B}
                gesture={settings.gestureMapping.B}
                isHolding={holdingGesture === settings.gestureMapping.B}
                holdProgress={holdProgress}
                isSelected={selectedOption === 'B'}
                isCorrectAnswer={currentQuestion.correctAnswer === 'B'}
                showResult={gameState === 'feedback'}
                onClick={() => {
                  if (gameState === 'playing' && !hasTriggeredRef.current) {
                    sounds.playLock();
                    triggerAnswer('B');
                  }
                }}
              />

              {/* OPTION D */}
              <CuteAnswerCard
                optionKey="D"
                text={currentQuestion.options.D}
                image={currentQuestion.optionImages?.D}
                gesture={settings.gestureMapping.D}
                isHolding={holdingGesture === settings.gestureMapping.D}
                holdProgress={holdProgress}
                isSelected={selectedOption === 'D'}
                isCorrectAnswer={currentQuestion.correctAnswer === 'D'}
                showResult={gameState === 'feedback'}
                onClick={() => {
                  if (gameState === 'playing' && !hasTriggeredRef.current) {
                    sounds.playLock();
                    triggerAnswer('D');
                  }
                }}
              />
            </div>
          </div>

          {/* CELEBRATION / FEEDBACK POPUP OVERLAY */}
          {gameState === 'feedback' && (
            <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
              {isCorrectAnswer ? (
                <div className="bg-white/95 border-2 border-dashed border-rose-400 rounded-3xl p-6 shadow-2xl glow-rose flex flex-col items-center text-center animate-in zoom-in-95 duration-200 pointer-events-auto">
                  {/* The uploaded Heart Hands Chibi Mascot! */}
                  <div className="w-28 h-36 mb-2 animate-bounce">
                    <ChibiAvatar pose="celebration" className="w-full h-full" />
                  </div>
                  <h3 className="text-2xl font-black text-rose-600 mb-1 font-['Comfortaa',sans-serif] flex items-center gap-2">
                    <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
                    CHÍNH XÁC! TUYỆT VỜI!
                  </h3>
                  <p className="text-sm font-black text-amber-500 mb-2">
                    +{currentQuestion.points} điểm
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-xs text-slate-600 max-w-sm bg-pink-50 p-2.5 rounded-2xl border-2 border-dashed border-pink-200 font-medium">
                      💡 {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white/95 border-2 border-dashed border-rose-400 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in shake duration-200 pointer-events-auto">
                  <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-2">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-rose-600 mb-1 font-['Comfortaa',sans-serif]">
                    CHƯA CHÍNH XÁC RỒI!
                  </h3>
                  <p className="text-xs text-slate-700 mb-2 font-semibold">
                    Đáp án đúng là: <span className="font-black text-emerald-600">{currentQuestion.correctAnswer}. {currentQuestion.options[currentQuestion.correctAnswer]}</span>
                  </p>
                  {settings.onWrongAnswer === 'retry' ? (
                    <p className="text-xs text-pink-600 font-bold">Hãy hạ tay xuống và thử lại nhé...</p>
                  ) : (
                    currentQuestion.explanation && (
                      <p className="text-xs text-slate-600 max-w-sm bg-pink-50 p-2.5 rounded-2xl border-2 border-dashed border-pink-200">
                        💡 {currentQuestion.explanation}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      ) : (
        /* GAME SUMMARY SCREEN (Stitched Pink-White Aesthetic) */
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-6">
          <div className="w-full max-w-xl bg-white/95 border-2 border-dashed border-pink-300 rounded-3xl p-8 shadow-xl text-center flex flex-col items-center backdrop-blur-md">
            {/* Chibi celebration trophy */}
            <div className="w-32 h-40 mb-3 animate-float">
              <ChibiAvatar pose="celebration" className="w-full h-full" />
            </div>

            <h2 className="text-3xl font-black text-pink-900 mb-1 font-['Comfortaa',sans-serif]">
              HOÀN THÀNH XUẤT SẮC!
            </h2>
            <p className="text-xs text-pink-600 font-bold mb-6">
              Bạn đã hoàn thành bộ đề trắc nghiệm cử chỉ
            </p>

            {/* Score circle */}
            <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-pink-100 via-rose-100 to-pink-50 border-4 border-dashed border-pink-400 flex flex-col items-center justify-center mb-6 shadow-sm">
              <span className="text-4xl font-black text-rose-600">{score}</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Tổng điểm</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 w-full mb-6">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-300">
                <span className="text-2xl font-black text-emerald-600">{correctCount}</span>
                <p className="text-xs text-emerald-700 font-bold">Câu đúng</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-dashed border-rose-300">
                <span className="text-2xl font-black text-rose-600">{wrongCount}</span>
                <p className="text-xs text-rose-700 font-bold">Câu chưa đúng</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-sm shadow-md shadow-pink-200 flex items-center justify-center gap-2 transition-all hover:scale-102 border-2 border-dashed border-pink-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>

              <button
                onClick={onBackToHome}
                className="flex-1 py-3.5 rounded-2xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold text-sm border-2 border-dashed border-pink-300 flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4 text-pink-500" />
                <span>Về Trang Chủ</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 transition-all"
              >
                <Settings className="w-4 h-4 text-pink-500" />
                <span>Cài Đặt</span>
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

// Cute Stitched Answer Card Sub-component
interface CuteAnswerCardProps {
  optionKey: OptionKey;
  text: string;
  image?: string;
  gesture: GestureType;
  isHolding: boolean;
  holdProgress?: number;
  isSelected: boolean;
  isCorrectAnswer: boolean;
  showResult: boolean;
  onClick: () => void;
}

const CuteAnswerCard: React.FC<CuteAnswerCardProps> = ({
  optionKey,
  text,
  image,
  gesture,
  isHolding,
  holdProgress = 0,
  isSelected,
  isCorrectAnswer,
  showResult,
  onClick,
}) => {
  const meta = GESTURE_LABELS[gesture] || {
    title: 'Cử chỉ',
    subtitle: '',
    color: 'text-pink-700',
    border: 'border-pink-300',
    bg: 'from-pink-50 via-white to-pink-50',
    badge: 'bg-pink-400 text-white',
  };

  // Border & Glow coloring based on state
  let cardBorder = 'border-pink-200 hover:border-pink-400';
  let cardBg = 'bg-white';
  let badgeClass = meta.badge;

  if (optionKey === 'A') {
    cardBorder = 'border-sky-300 hover:border-sky-400';
    badgeClass = 'bg-sky-400 text-white';
  } else if (optionKey === 'B') {
    cardBorder = 'border-emerald-300 hover:border-emerald-400';
    badgeClass = 'bg-emerald-400 text-white';
  } else if (optionKey === 'C') {
    cardBorder = 'border-purple-300 hover:border-purple-400';
    badgeClass = 'bg-purple-400 text-white';
  } else if (optionKey === 'D') {
    cardBorder = 'border-rose-300 hover:border-rose-400';
    badgeClass = 'bg-rose-400 text-white';
  }

  // Active holding or result style overrides
  if (isHolding) {
    cardBorder = 'border-pink-500 ring-4 ring-pink-300 shadow-xl scale-102';
    cardBg = 'bg-pink-50';
  }

  if (showResult) {
    if (isCorrectAnswer) {
      cardBorder = 'border-emerald-500 ring-4 ring-emerald-300 bg-emerald-50 shadow-lg';
    } else if (isSelected && !isCorrectAnswer) {
      cardBorder = 'border-rose-500 ring-4 ring-rose-300 bg-rose-50 shadow-lg';
    }
  }

  return (
    <div
      onClick={onClick}
      className={`relative p-3.5 md:p-4 rounded-3xl ${cardBg} border-2 border-dashed ${cardBorder} shadow-sm cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[145px] md:min-h-[165px] overflow-hidden`}
    >
      {/* Top row: Option letter badge & Gesture name */}
      <div className="flex items-center justify-between mb-2">
        <span className={`w-8 h-8 rounded-2xl ${badgeClass} font-black text-sm flex items-center justify-center shadow-sm border border-white`}>
          {optionKey}
        </span>
        <div className="flex items-center gap-1.5">
          {isHolding && (
            <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full border border-dashed border-rose-300 animate-pulse">
              {holdProgress}%
            </span>
          )}
          <span className={`text-xs font-black uppercase tracking-wide ${meta.color} bg-white/90 px-2.5 py-0.5 rounded-full border border-dashed border-pink-200 shadow-xs`}>
            {meta.title}
          </span>
        </div>
      </div>

      {/* Center content: User-provided Chibi Character + Answer Text */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-20 md:w-20 md:h-24 shrink-0">
          <ChibiAvatar pose={gesture} className="w-full h-full" />
        </div>

        <div className="flex-1">
          <p className="font-extrabold text-base md:text-lg text-slate-800 leading-snug line-clamp-3">
            {text}
          </p>
          {image && (
            <div className="mt-1 w-12 h-12 rounded-xl overflow-hidden border border-dashed border-pink-300">
              <img src={image} alt={text} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Holding visual candy progress bar filling inside the card */}
      {isHolding && (
        <div className="absolute inset-x-0 bottom-0 h-2.5 bg-pink-100 rounded-b-3xl overflow-hidden border-t border-pink-200">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 transition-all duration-75 shadow-sm"
            style={{ width: `${Math.max(8, holdProgress)}%` }}
          />
        </div>
      )}
    </div>
  );
};

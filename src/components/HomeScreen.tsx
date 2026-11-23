import React, { useState, useEffect } from 'react';
import { QuizSet, GameSettings } from '../types';
import { ChibiAvatar } from './ChibiAvatars';
import { 
  Play, 
  Settings, 
  Sparkles, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Music,
  Maximize2, 
  Minimize2, 
  Camera, 
  HelpCircle, 
  Check, 
  Layers,
  Heart,
  GraduationCap,
  ChevronRight,
  Clock,
  Sparkle
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HomeScreenProps {
  quizSets: QuizSet[];
  activeQuizSetId: string;
  onSelectQuizSet: (id: string) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
  settings: GameSettings;
  soundOn: boolean;
  onToggleSound: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  quizSets,
  activeQuizSetId,
  onSelectQuizSet,
  onStartGame,
  onOpenSettings,
  settings,
  soundOn,
  onToggleSound,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);

  // Sync BGM
  useEffect(() => {
    if (bgmOn) {
      sounds.startBgm();
    } else {
      sounds.stopBgm();
    }
    return () => {
      // Don't stop if moving to GameScreen, or stop when component unmounts
    };
  }, [bgmOn]);

  const activeSet = quizSets.find((s) => s.id === activeQuizSetId) || quizSets[0];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="relative w-full max-w-[1500px] mx-auto min-h-screen flex flex-col justify-between p-3 sm:p-5 md:p-8 select-none">
      {/* Background ambient lighting - Soft Cute Pink & White */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-rose-200/40 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/2 left-10 w-[350px] h-[350px] bg-purple-200/30 rounded-full blur-[120px]"></div>
      </div>

      {/* TOP HEADER BAR (Stitched White-Pink Card) */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 rounded-3xl bg-white/90 border-2 border-dashed border-pink-300 shadow-sm shadow-pink-100 backdrop-blur-md mb-4 sm:mb-6">
        {/* Brand & Author lockup */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-400 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-300/40 border-2 border-white">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-pink-900 tracking-wide">
                EduPose
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-600 border border-dashed border-pink-300 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                Vui Học Cử Chỉ
              </span>
            </div>
            {/* Prominent Author Badge */}
            <div className="flex items-center gap-1.5 text-xs text-pink-700/80 font-semibold mt-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-pink-500" />
              <span>Tác giả: <strong className="text-pink-900 font-extrabold">Thầy Trần Hồng Quân</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              setShowHowToPlay(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold border-2 border-dashed border-pink-200 transition-all shadow-sm"
            title="Xem hướng dẫn cách chơi"
          >
            <HelpCircle className="w-4 h-4 text-pink-500" />
            <span className="hidden md:inline">Cách Chơi</span>
          </button>

          {/* Cute BGM Music Button */}
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
            <span className="text-[11px] font-bold hidden sm:inline">{bgmOn ? 'Nhạc: Bật' : 'Nhạc: Tắt'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onToggleSound();
            }}
            className={`p-2 rounded-2xl border-2 border-dashed transition-all shadow-sm ${
              soundOn
                ? 'bg-pink-100 text-pink-600 border-pink-300 hover:bg-pink-200'
                : 'bg-slate-100 text-slate-400 border-slate-300 hover:text-slate-600'
            }`}
            title={soundOn ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              toggleFullscreen();
            }}
            className="p-2 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 border-2 border-dashed border-pink-200 transition-all shadow-sm"
            title="Toàn màn hình máy chiếu"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white border-2 border-dashed border-pink-200 text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-pink-200"
            title="Mở bảng cài đặt giáo viên & quản lý bộ đề"
          >
            <Settings className="w-4 h-4 text-white" />
            <span>Cài Đặt</span>
          </button>
        </div>
      </header>

      {/* HERO BANNER SECTION (Cute Pink & White Stitched Aesthetic) */}
      <section className="relative z-10 flex-1 flex flex-col justify-center my-2 sm:my-4">
        <div className="relative w-full rounded-3xl bg-white/95 border-2 border-dashed border-pink-300 p-6 sm:p-8 md:p-10 shadow-lg shadow-pink-100 backdrop-blur-xl flex flex-col items-center text-center overflow-hidden">
          
          {/* Decorative Corner Needle Stitches */}
          <div className="absolute top-3 left-4 text-pink-300 font-bold text-xs select-none">✂ - - - - - - -</div>
          <div className="absolute top-3 right-4 text-pink-300 font-bold text-xs select-none">- - - - - - - 🌸</div>

          {/* Animated Mascot Row - Featuring the 5 user-provided chibi characters! */}
          <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-8 mb-5 sm:mb-6">
            {/* 1. Left hand up */}
            <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '3.0s' }}>
              <div className="w-16 h-20 sm:w-24 sm:h-28 md:w-28 md:h-32 transition-transform duration-300 hover:scale-110">
                <ChibiAvatar pose="left_hand_up" className="w-full h-full" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full border border-dashed border-sky-300 mt-1">
                A. Tay trái
              </span>
            </div>

            {/* 2. Right hand up */}
            <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '2.7s', animationDelay: '0.3s' }}>
              <div className="w-16 h-20 sm:w-24 sm:h-28 md:w-28 md:h-32 transition-transform duration-300 hover:scale-110">
                <ChibiAvatar pose="right_hand_up" className="w-full h-full" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-dashed border-emerald-300 mt-1">
                B. Tay phải
              </span>
            </div>

            {/* 5. Heart Hands Tuyệt Vời Center Mascot */}
            <div className="flex flex-col items-center animate-pulse-subtle">
              <div className="w-20 h-24 sm:w-28 sm:h-36 md:w-36 md:h-44 transition-transform duration-300 hover:scale-110 drop-shadow-md">
                <ChibiAvatar pose="celebration" className="w-full h-full" />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-rose-700 bg-rose-100 px-3 py-0.5 rounded-full border border-dashed border-rose-300 mt-1 flex items-center gap-1 shadow-sm">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                Tuyệt Vời!
              </span>
            </div>

            {/* 3. Arms spread */}
            <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '3.1s', animationDelay: '0.2s' }}>
              <div className="w-16 h-20 sm:w-24 sm:h-28 md:w-28 md:h-32 transition-transform duration-300 hover:scale-110">
                <ChibiAvatar pose="arms_spread" className="w-full h-full" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-dashed border-purple-300 mt-1">
                C. Dang ngang
              </span>
            </div>

            {/* 4. Both hands up */}
            <div className="flex flex-col items-center animate-bounce" style={{ animationDuration: '3.3s', animationDelay: '0.5s' }}>
              <div className="w-16 h-20 sm:w-24 sm:h-28 md:w-28 md:h-32 transition-transform duration-300 hover:scale-110">
                <ChibiAvatar pose="both_hands_up" className="w-full h-full" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full border border-dashed border-pink-300 mt-1">
                D. Giơ cao
              </span>
            </div>
          </div>

          {/* Cute Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100 border-2 border-dashed border-pink-300 text-pink-700 text-xs sm:text-sm font-extrabold uppercase tracking-wide mb-3">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>Trò Chơi Học Tập Tương Tác Camera AI</span>
          </div>

          {/* Vietnamese Game Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-pink-900 tracking-tight leading-tight max-w-4xl mb-2 font-['Comfortaa',sans-serif]">
            VUI HỌC CÙNG CỬ CHỈ
          </h1>

          {/* Author Byline */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs sm:text-sm text-pink-600 font-bold bg-pink-50 px-3.5 py-1 rounded-full border border-dashed border-pink-300">
              Biên soạn & Thiết kế: <strong className="text-pink-900 font-black">Thầy Trần Hồng Quân</strong>
            </span>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mb-6 sm:mb-8 font-medium leading-relaxed">
            Học sinh đứng trước camera máy chiếu, thực hiện tư thế tay theo các bé Chibi đáng yêu để chốt đáp án A, B, C, D. Hệ thống chấm điểm tự động tức thì!
          </p>

          {/* MAIN CUTE CTA BUTTON: CHƠI NGAY */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => {
                sounds.playClick();
                onStartGame();
              }}
              className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white font-black text-lg sm:text-xl md:text-2xl tracking-wide shadow-xl shadow-pink-300/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-dashed border-pink-200"
            >
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
              <span>CHƠI NGAY: {activeSet.title}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-pink-600/80 mt-4 font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-pink-500" /> Giữ tư thế {settings.holdDuration}s để xác nhận
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-pink-500" /> {activeSet.questions.length} câu hỏi sẵn sàng
            </span>
          </div>
        </div>
      </section>

      {/* QUIZ SETS SELECTOR CAROUSEL (Stitched Dashed Cards) */}
      <section className="relative z-10 my-4 sm:my-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-600" />
            <h2 className="text-sm sm:text-base font-extrabold text-pink-900 tracking-wide">
              Chọn Bộ Câu Hỏi ({quizSets.length} bộ đề)
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="text-xs text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 bg-pink-50 px-2.5 py-1 rounded-xl border border-dashed border-pink-300"
          >
            <span>Quản lý & Thêm bộ đề mới</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {quizSets.map((qSet) => {
            const isSelected = qSet.id === activeQuizSetId;

            return (
              <div
                key={qSet.id}
                onClick={() => {
                  sounds.playClick();
                  onSelectQuizSet(qSet.id);
                }}
                className={`relative p-4 sm:p-5 rounded-3xl cursor-pointer transition-all duration-200 border-2 border-dashed flex flex-col justify-between ${
                  isSelected
                    ? 'bg-pink-50/90 border-pink-400 ring-4 ring-pink-200/50 shadow-md shadow-pink-200 scale-102'
                    : 'bg-white hover:bg-pink-50/50 border-pink-200 hover:border-pink-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-xs font-bold text-pink-700 border border-dashed border-pink-300 flex items-center gap-1.5">
                      <Sparkle className="w-3 h-3 text-pink-500" />
                      <span>{qSet.category || 'Bộ Đề'}</span>
                    </span>

                    {isSelected ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>ĐANG CHỌN</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-pink-400 font-semibold">Bấm để chọn</span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-pink-950 mb-1.5 line-clamp-1">
                    {qSet.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {qSet.description || 'Bộ câu hỏi tương tác phản xạ nhanh.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-dashed border-pink-200 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-pink-600 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {qSet.questions.length} câu hỏi
                  </span>
                  <span className="text-rose-500 font-bold">
                    ★ {qSet.questions.reduce((sum, q) => sum + (q.points || 10), 0)} điểm
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER QUICK GESTURE REFERENCE (Stitched Pink Card) */}
      <footer className="relative z-10 rounded-3xl bg-white/90 border-2 border-dashed border-pink-300 p-3 sm:p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-extrabold text-pink-800 uppercase tracking-wider flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
              4 Cử chỉ tương ứng:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full md:w-auto flex-1">
            <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-sky-50/80 border-2 border-dashed border-sky-300">
              <div className="w-8 h-10 shrink-0">
                <ChibiAvatar pose="left_hand_up" className="w-full h-full" />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-black text-sky-600">A</span>
                <p className="text-slate-700 font-bold">Tay trái lên</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-emerald-50/80 border-2 border-dashed border-emerald-300">
              <div className="w-8 h-10 shrink-0">
                <ChibiAvatar pose="right_hand_up" className="w-full h-full" />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-black text-emerald-600">B</span>
                <p className="text-slate-700 font-bold">Tay phải lên</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-purple-50/80 border-2 border-dashed border-purple-300">
              <div className="w-8 h-10 shrink-0">
                <ChibiAvatar pose="arms_spread" className="w-full h-full" />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-black text-purple-600">C</span>
                <p className="text-slate-700 font-bold">Hai tay dang ngang</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-pink-50/80 border-2 border-dashed border-pink-300">
              <div className="w-8 h-10 shrink-0">
                <ChibiAvatar pose="both_hands_up" className="w-full h-full" />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-black text-pink-600">D</span>
                <p className="text-slate-700 font-bold">Hai tay giơ cao</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border-2 border-dashed border-pink-400 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-pink-200">
              <h3 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                <span>Cách Tham Gia Trò Chơi</span>
              </h3>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowHowToPlay(false);
                }}
                className="text-pink-400 hover:text-pink-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="p-3 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-pink-500 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-pink-900">Đứng trước Camera máy chiếu</p>
                  <p className="text-slate-600 text-xs mt-0.5">Khoảng cách 1.5 - 2 mét để camera thu trọn phần thân trên.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-pink-900">Quan sát cử chỉ chibi trên thẻ đáp án</p>
                  <p className="text-slate-600 text-xs mt-0.5">Giơ tay trái (A), Giơ tay phải (B), Dang ngang (C), Giơ cao cả 2 tay (D).</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-bold text-pink-900">Giữ cử chỉ 0.8 giây</p>
                  <p className="text-slate-600 text-xs mt-0.5">Thanh kẹo ngọt màu hồng dưới camera sẽ chạy đầy để xác nhận đáp án của bạn.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowHowToPlay(false);
                }}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md shadow-pink-200"
              >
                Đã hiểu, Bắt đầu chơi!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { QuizSet, Question, GameSettings, OptionKey, GestureType, DetectionResult } from '../types';
import { DEFAULT_QUIZ_SETS, GESTURE_LABELS } from '../utils/defaults';
import { ChibiAvatar } from './ChibiAvatars';
import { PoseDetector } from '../utils/poseDetection';
import { sounds } from '../utils/audio';
import { 
  BookOpen, 
  Settings as SettingsIcon, 
  Video, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Sparkles, 
  RotateCcw, 
  FileText, 
  Play, 
  Camera,
  Layers,
  Home,
  Copy,
  FolderPlus,
  Heart,
  GraduationCap
} from 'lucide-react';

interface TeacherSettingsProps {
  quizSets: QuizSet[];
  activeQuizSetId: string;
  settings: GameSettings;
  onSaveQuizSets: (sets: QuizSet[]) => void;
  onSelectQuizSet: (id: string) => void;
  onSaveSettings: (s: GameSettings) => void;
  onStartGame: () => void;
  onBackToHome: () => void;
}

export const TeacherSettings: React.FC<TeacherSettingsProps> = ({
  quizSets,
  activeQuizSetId,
  settings,
  onSaveQuizSets,
  onSelectQuizSet,
  onSaveSettings,
  onStartGame,
  onBackToHome,
}) => {
  // Tabs: Quizzes, Rules, Camera Test (Character image settings tab completely removed as requested)
  const [activeTab, setActiveTab] = useState<'quizzes' | 'rules' | 'test'>('quizzes');

  // Currently selected quiz set in settings
  const activeSet = quizSets.find((s) => s.id === activeQuizSetId) || quizSets[0] || {
    id: 'default',
    title: 'Bộ đề mới',
    questions: [],
    createdAt: new Date().toISOString(),
  };

  // Create/Edit Quiz Set Modal
  const [showSetModal, setShowSetModal] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [setTitle, setSetTitle] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [setCategory, setSetCategory] = useState('');

  // Question Form State inside current Quiz Set
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>({
    text: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    points: settings.defaultPoints,
    timeLimit: settings.defaultTimeLimit,
    explanation: '',
  });

  // Bulk paste modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Camera test state
  const videoTestRef = useRef<HTMLVideoElement | null>(null);
  const canvasTestRef = useRef<HTMLCanvasElement | null>(null);
  const [detector, setDetector] = useState<PoseDetector | null>(null);
  const [testResult, setTestResult] = useState<DetectionResult>({
    hasPerson: false,
    detectedGesture: 'none',
    confidence: 0,
  });
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    let activeDetector: PoseDetector | null = null;
    if (activeTab === 'test') {
      const initTestCam = async () => {
        if (!videoTestRef.current || !canvasTestRef.current) return;
        setCameraStatus('idle');
        setCameraError('');
        const pDetector = new PoseDetector();
        const ok = await pDetector.initialize(
          videoTestRef.current,
          canvasTestRef.current,
          (res) => setTestResult(res),
          (err) => {
            setCameraStatus('error');
            setCameraError(err);
          }
        );
        if (ok) {
          setCameraStatus('running');
          activeDetector = pDetector;
          setDetector(pDetector);
        }
      };
      initTestCam();
    } else {
      if (detector) {
        detector.stop();
        setDetector(null);
      }
    }

    return () => {
      if (activeDetector) activeDetector.stop();
    };
  }, [activeTab]);

  // Quiz Set Handlers
  const handleOpenCreateSet = () => {
    setEditingSetId(null);
    setSetTitle('');
    setSetDescription('');
    setSetCategory('Tổng Hợp');
    setShowSetModal(true);
  };

  const handleOpenEditSet = (s: QuizSet) => {
    setEditingSetId(s.id);
    setSetTitle(s.title);
    setSetDescription(s.description || '');
    setSetCategory(s.category || 'Tổng Hợp');
    setShowSetModal(true);
  };

  const handleSaveSetModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setTitle.trim()) return;

    if (editingSetId) {
      const updated = quizSets.map((s) =>
        s.id === editingSetId
          ? { ...s, title: setTitle.trim(), description: setDescription.trim(), category: setCategory.trim() }
          : s
      );
      onSaveQuizSets(updated);
      showToast('Đã cập nhật thông tin bộ đề!');
    } else {
      const newId = 'set_' + Date.now();
      const newSet: QuizSet = {
        id: newId,
        title: setTitle.trim(),
        description: setDescription.trim(),
        category: setCategory.trim() || 'Tổng Hợp',
        questions: [],
        createdAt: new Date().toISOString(),
      };
      onSaveQuizSets([...quizSets, newSet]);
      onSelectQuizSet(newId);
      showToast('Đã tạo bộ đề mới!');
    }
    setShowSetModal(false);
  };

  const handleDeleteSet = (id: string) => {
    if (quizSets.length <= 1) {
      alert('Cần giữ lại ít nhất 1 bộ đề!');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa bộ đề này?')) {
      const remaining = quizSets.filter((s) => s.id !== id);
      onSaveQuizSets(remaining);
      if (activeQuizSetId === id) {
        onSelectQuizSet(remaining[0].id);
      }
      showToast('Đã xóa bộ đề.');
    }
  };

  const handleDuplicateSet = (s: QuizSet) => {
    const duplicated: QuizSet = {
      ...s,
      id: 'set_' + Date.now(),
      title: `${s.title} (Bản sao)`,
      createdAt: new Date().toISOString(),
    };
    onSaveQuizSets([...quizSets, duplicated]);
    onSelectQuizSet(duplicated.id);
    showToast('Đã nhân bản bộ đề thành công!');
  };

  // Question Handlers inside active Quiz Set
  const handleStartEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setFormData({
      text: q.text,
      image: q.image,
      options: { ...q.options },
      optionImages: q.optionImages ? { ...q.optionImages } : undefined,
      correctAnswer: q.correctAnswer,
      points: q.points,
      timeLimit: q.timeLimit,
      explanation: q.explanation || '',
    });
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setFormData({
      text: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      points: settings.defaultPoints,
      timeLimit: settings.defaultTimeLimit,
      explanation: '',
    });
  };

  const handleSaveQuestionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text?.trim() || !formData.options?.A || !formData.options?.B || !formData.options?.C || !formData.options?.D) {
      alert('Vui lòng điền đầy đủ câu hỏi và 4 đáp án A, B, C, D!');
      return;
    }

    const newQ: Question = {
      id: editingQuestionId || 'q_' + Date.now(),
      text: formData.text.trim(),
      image: formData.image,
      options: {
        A: formData.options.A.trim(),
        B: formData.options.B.trim(),
        C: formData.options.C.trim(),
        D: formData.options.D.trim(),
      },
      optionImages: formData.optionImages,
      correctAnswer: formData.correctAnswer || 'A',
      points: Number(formData.points) || settings.defaultPoints,
      timeLimit: Number(formData.timeLimit) || settings.defaultTimeLimit,
      explanation: formData.explanation?.trim() || '',
    };

    let updatedQuestions: Question[];
    if (editingQuestionId) {
      updatedQuestions = activeSet.questions.map((q) => (q.id === editingQuestionId ? newQ : q));
      showToast('Đã cập nhật câu hỏi!');
    } else {
      updatedQuestions = [...activeSet.questions, newQ];
      showToast('Đã thêm câu hỏi vào bộ đề!');
    }

    const updatedSets = quizSets.map((s) =>
      s.id === activeSet.id ? { ...s, questions: updatedQuestions } : s
    );
    onSaveQuizSets(updatedSets);
    handleCancelEditQuestion();
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Xóa câu hỏi này khỏi bộ đề?')) {
      const updatedQuestions = activeSet.questions.filter((q) => q.id !== id);
      const updatedSets = quizSets.map((s) =>
        s.id === activeSet.id ? { ...s, questions: updatedQuestions } : s
      );
      onSaveQuizSets(updatedSets);
      showToast('Đã xóa câu hỏi.');
    }
  };

  // Bulk paste handler
  const handleProcessBulk = () => {
    if (!bulkText.trim()) return;
    try {
      const blocks = bulkText.split(/(?:Câu\s*\d+[\s:.-]+|\n\s*\n)/i).map(b => b.trim()).filter(Boolean);
      const parsed: Question[] = [];

      for (let i = 0; i < blocks.length; i++) {
        const lines = blocks[i].split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 5) continue;

        let qText = lines[0].replace(/^Câu\s*\d+[\s:.-]+/i, '').trim();
        let optA = '';
        let optB = '';
        let optC = '';
        let optD = '';
        let correct: OptionKey = 'A';

        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (/^A[\.\:\)]/i.test(line)) optA = line.replace(/^A[\.\:\)]\s*/i, '');
          else if (/^B[\.\:\)]/i.test(line)) optB = line.replace(/^B[\.\:\)]\s*/i, '');
          else if (/^C[\.\:\)]/i.test(line)) optC = line.replace(/^C[\.\:\)]\s*/i, '');
          else if (/^D[\.\:\)]/i.test(line)) optD = line.replace(/^D[\.\:\)]\s*/i, '');
          else if (/^(?:Đáp án|ĐA|Correct|Answer)[\s\:\-]+([A-D])/i.test(line)) {
            const match = line.match(/^(?:Đáp án|ĐA|Correct|Answer)[\s\:\-]+([A-D])/i);
            if (match && match[1]) {
              correct = match[1].toUpperCase() as OptionKey;
            }
          }
        }

        if (qText && optA && optB && optC && optD) {
          parsed.push({
            id: 'bulk_' + Date.now() + '_' + i,
            text: qText,
            options: { A: optA, B: optB, C: optC, D: optD },
            correctAnswer: correct,
            points: settings.defaultPoints,
            timeLimit: settings.defaultTimeLimit,
          });
        }
      }

      if (parsed.length === 0) {
        setBulkError('Không nhận diện được định dạng câu hỏi.');
        return;
      }

      const updatedSets = quizSets.map((s) =>
        s.id === activeSet.id ? { ...s, questions: [...s.questions, ...parsed] } : s
      );
      onSaveQuizSets(updatedSets);
      setShowBulkModal(false);
      setBulkText('');
      setBulkError('');
      showToast(`Đã thêm thành công ${parsed.length} câu hỏi vào "${activeSet.title}"!`);
    } catch {
      setBulkError('Có lỗi xảy ra khi phân tích văn bản. Vui lòng thử lại.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-xl animate-bounce border-2 border-white">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar (Stitched White-Pink) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/95 border-2 border-dashed border-pink-300 shadow-sm mb-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 border-2 border-dashed border-pink-200 transition-all shadow-sm"
            title="Quay lại Trang Chủ"
          >
            <Home className="w-5 h-5 text-pink-500" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-pink-900 tracking-wide font-['Comfortaa',sans-serif]">
                Cài Đặt Giáo Viên
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-extrabold border border-dashed border-pink-300">
                Lưu Bộ Nhớ Máy
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-pink-600/90 font-semibold mt-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-pink-500" />
              <span>Tác giả: <strong className="text-pink-900 font-bold">Thầy Trần Hồng Quân</strong></span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onStartGame();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-black transition-all shadow-md shadow-pink-200 hover:scale-105 active:scale-95 border-2 border-dashed border-pink-200"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Vào Màn Chơi</span>
          </button>
        </div>
      </div>

      {/* Tabs (Images tab removed as requested) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/80 border-2 border-dashed border-pink-200 mb-6 shadow-sm">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('quizzes');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-extrabold transition-all border-2 border-dashed ${
            activeTab === 'quizzes'
              ? 'bg-pink-500 text-white border-pink-300 shadow-md shadow-pink-200'
              : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50 border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Quản lý Bộ Đề ({quizSets.length} bộ đề)</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('rules');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-extrabold transition-all border-2 border-dashed ${
            activeTab === 'rules'
              ? 'bg-pink-500 text-white border-pink-300 shadow-md shadow-pink-200'
              : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50 border-transparent'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Luật chơi & Giữ cử chỉ</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('test');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-extrabold transition-all border-2 border-dashed ${
            activeTab === 'test'
              ? 'bg-pink-500 text-white border-pink-300 shadow-md shadow-pink-200'
              : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50 border-transparent'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Kiểm tra cử chỉ & Camera</span>
        </button>
      </div>

      {/* TAB 1: QUIZ SETS & QUESTIONS MANAGER */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {/* Top: Quiz Set Selector Strip */}
          <div className="bg-white/95 border-2 border-dashed border-pink-300 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b-2 border-dashed border-pink-200">
              <div>
                <h2 className="text-base font-extrabold text-pink-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-500" />
                  <span>Danh Sách Các Bộ Đề</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn bộ đề để sửa câu hỏi hoặc bấm "+ Tạo bộ đề mới"
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreateSet}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-black shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Bộ Đề Mới</span>
                </button>
                <button
                  onClick={() => onSaveQuizSets(DEFAULT_QUIZ_SETS)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold border border-dashed border-pink-300"
                  title="Khôi phục lại các bộ đề mẫu ban đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bộ đề gốc</span>
                </button>
              </div>
            </div>

            {/* Quiz Sets Horizontal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quizSets.map((s) => {
                const isSelected = s.id === activeSet.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectQuizSet(s.id)}
                    className={`p-3.5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-pink-50 border-pink-400 ring-4 ring-pink-200/50 shadow-sm'
                        : 'bg-white border-pink-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[10px] font-bold text-pink-700 uppercase border border-dashed border-pink-200">
                          {s.category || 'Chung'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {s.questions.length} câu
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-pink-950 truncate">{s.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditSet(s)}
                        className="p-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700"
                        title="Đổi tên bộ đề"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateSet(s)}
                        className="p-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700"
                        title="Nhân bản bộ đề này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSet(s.id)}
                        className="p-1.5 rounded-xl bg-pink-50 hover:bg-rose-100 text-rose-500"
                        title="Xóa bộ đề"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Split: Questions inside currently selected Quiz Set */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Question Input Form (Stitched White Card) */}
            <div className="lg:col-span-5 bg-white/95 border-2 border-dashed border-pink-300 rounded-3xl p-5 sm:p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-pink-200 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-pink-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-pink-500" />
                    <span>{editingQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</span>
                  </h3>
                  <p className="text-[11px] text-pink-600 font-bold">Bộ đề: {activeSet.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="px-3 py-1 rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200 text-xs font-bold border border-dashed border-pink-300"
                >
                  Dán hàng loạt
                </button>
              </div>

              <form onSubmit={handleSaveQuestionForm} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi *</label>
                  <textarea
                    rows={2}
                    value={formData.text || ''}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="Ví dụ: 3 + 5 = ? hoặc Thủ đô Việt Nam là thành phố nào?"
                    className="w-full px-3 py-2 rounded-2xl bg-pink-50/50 border-2 border-dashed border-pink-200 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400"
                    required
                  />
                </div>

                {/* 4 Options */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">4 Phương án trả lời *</label>
                  {(['A', 'B', 'C', 'D'] as OptionKey[]).map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                          formData.correctAnswer === opt
                            ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300'
                            : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                        }`}
                        title="Bấm để chọn đây là đáp án đúng"
                      >
                        {opt}
                      </button>
                      <input
                        type="text"
                        value={formData.options?.[opt] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            options: { ...formData.options!, [opt]: e.target.value },
                          })
                        }
                        placeholder={`Đáp án ${opt}`}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-pink-50/50 border-2 border-dashed border-pink-200 text-xs text-slate-800 focus:outline-none focus:border-pink-400 font-semibold"
                        required
                      />
                    </div>
                  ))}
                  <p className="text-[10px] text-rose-500 italic font-semibold">
                    * Bấm nút chữ cái A/B/C/D để đánh dấu đáp án đúng.
                  </p>
                </div>

                {/* Points & Time limit */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm câu này</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.points || 10}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl bg-pink-50/50 border-2 border-dashed border-pink-200 text-xs text-slate-800 focus:outline-none focus:border-pink-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian (giây)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={formData.timeLimit || 15}
                      onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl bg-pink-50/50 border-2 border-dashed border-pink-200 text-xs text-slate-800 focus:outline-none focus:border-pink-400 font-bold"
                    />
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giải thích đáp án (tùy chọn)</label>
                  <input
                    type="text"
                    value={formData.explanation || ''}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Lời giải thích ngắn gọn khi học sinh trả lời..."
                    className="w-full px-3 py-1.5 rounded-xl bg-pink-50/50 border-2 border-dashed border-pink-200 text-xs text-slate-800 focus:outline-none focus:border-pink-400"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-pink-200"
                  >
                    {editingQuestionId ? 'Lưu thay đổi' : 'Thêm vào bộ đề này'}
                  </button>
                  {editingQuestionId && (
                    <button
                      type="button"
                      onClick={handleCancelEditQuestion}
                      className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right: Question List in Active Set (Stitched White Card) */}
            <div className="lg:col-span-7 bg-white/95 border-2 border-dashed border-pink-300 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-pink-200 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-pink-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-pink-500" />
                      <span>Câu hỏi trong "{activeSet.title}"</span>
                    </h3>
                    <p className="text-xs text-pink-600/90 font-medium">Tổng số: {activeSet.questions.length} câu</p>
                  </div>
                </div>

                {activeSet.questions.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-pink-50/50 border-2 border-dashed border-pink-200">
                    <p className="text-sm font-bold text-pink-800 mb-1">Bộ đề này chưa có câu hỏi nào</p>
                    <p className="text-xs text-slate-500 mb-4">Hãy nhập câu hỏi ở cột bên trái hoặc dán hàng loạt để bắt đầu.</p>
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="px-4 py-2 rounded-2xl bg-pink-500 text-white font-bold text-xs shadow-sm hover:bg-pink-600"
                    >
                      Dán câu hỏi hàng loạt ngay
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {activeSet.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-2xl border-2 border-dashed transition-all ${
                          editingQuestionId === q.id
                            ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-200'
                            : 'bg-white border-pink-200 hover:border-pink-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-extrabold border border-dashed border-pink-300">
                                Câu {idx + 1}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {q.points}đ · {q.timeLimit}s
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black border border-dashed border-rose-300">
                                Đúng: {q.correctAnswer}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 mb-2">{q.text}</h4>

                            {/* Options preview */}
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              {(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => (
                                <div
                                  key={key}
                                  className={`p-1.5 rounded-xl border-2 border-dashed ${
                                    q.correctAnswer === key
                                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-extrabold'
                                      : 'bg-slate-50 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span className="font-bold mr-1">{key}.</span>
                                  <span>{q.options[key]}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEditQuestion(q)}
                              className="p-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700"
                              title="Sửa câu này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 rounded-xl bg-pink-50 hover:bg-rose-100 text-rose-500"
                              title="Xóa câu này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t-2 border-dashed border-pink-200 flex justify-between text-xs text-slate-500 font-semibold">
                <span>Bộ đề: {activeSet.title}</span>
                <span>Tổng: {activeSet.questions.reduce((sum, q) => sum + q.points, 0)} điểm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GAME RULES & HOLD DURATION */}
      {activeTab === 'rules' && (
        <div className="bg-white/95 border-2 border-dashed border-pink-300 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
          <h2 className="text-lg font-black text-pink-900 flex items-center gap-2 pb-4 border-b-2 border-dashed border-pink-200 font-['Comfortaa',sans-serif]">
            <SettingsIcon className="w-5 h-5 text-pink-500" />
            <span>Cài Đặt Luật Chơi & Tương Tác</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hold duration slider */}
            <div className="p-5 rounded-3xl bg-pink-50/60 border-2 border-dashed border-pink-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-extrabold text-pink-900">Thời gian giữ cử chỉ để xác nhận</label>
                <span className="text-sm font-mono font-bold text-pink-700 px-2 py-0.5 rounded-xl bg-white border-2 border-dashed border-pink-300">
                  {settings.holdDuration}s
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Học sinh cần giữ yên tư thế trong khoảng thời gian này để thanh xác nhận đầy dần, tránh bị nhận nhầm khi chỉ vô tình cử động tay.
              </p>
              <input
                type="range"
                min="0.4"
                max="2.0"
                step="0.1"
                value={settings.holdDuration}
                onChange={(e) => onSaveSettings({ ...settings, holdDuration: parseFloat(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-semibold">
                <span>0.4s (Nhanh)</span>
                <span>0.8s (Khuyên dùng)</span>
                <span>2.0s (Chắc chắn)</span>
              </div>
            </div>

            {/* Wrong answer rule */}
            <div className="p-5 rounded-3xl bg-pink-50/60 border-2 border-dashed border-pink-200">
              <label className="text-sm font-extrabold text-pink-900 block mb-2">Quy tắc khi trả lời sai</label>
              <p className="text-xs text-slate-500 mb-4">Xác định cách thức trò chơi phản ứng khi học sinh chọn sai đáp án.</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-dashed border-pink-200 cursor-pointer hover:border-pink-300">
                  <input
                    type="radio"
                    name="wrongRule"
                    checked={settings.onWrongAnswer === 'next'}
                    onChange={() => onSaveSettings({ ...settings, onWrongAnswer: 'next' })}
                    className="accent-pink-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Chuyển sang câu tiếp theo luôn</p>
                    <p className="text-slate-500">Không tính điểm câu này, tiếp tục hành trình</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-dashed border-pink-200 cursor-pointer hover:border-pink-300">
                  <input
                    type="radio"
                    name="wrongRule"
                    checked={settings.onWrongAnswer === 'retry'}
                    onChange={() => onSaveSettings({ ...settings, onWrongAnswer: 'retry' })}
                    className="accent-pink-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Cho phép thực hiện lại cử chỉ</p>
                    <p className="text-slate-500">Giữ nguyên thời gian còn lại để học sinh sửa sai</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Default time & score */}
            <div className="p-5 rounded-3xl bg-pink-50/60 border-2 border-dashed border-pink-200">
              <label className="text-sm font-extrabold text-pink-900 block mb-3">Thời gian & Điểm mặc định</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-600 mb-1 block font-bold">Thời gian mỗi câu</span>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={settings.defaultTimeLimit}
                    onChange={(e) => onSaveSettings({ ...settings, defaultTimeLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-dashed border-pink-200 text-sm text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-600 mb-1 block font-bold">Điểm mặc định</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.defaultPoints}
                    onChange={(e) => onSaveSettings({ ...settings, defaultPoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-dashed border-pink-200 text-sm text-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Effects and Sound */}
            <div className="p-5 rounded-3xl bg-pink-50/60 border-2 border-dashed border-pink-200 space-y-3">
              <label className="text-sm font-extrabold text-pink-900 block">Hiệu ứng & Âm thanh</label>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-dashed border-pink-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-pink-500" /> Âm thanh phản hồi học tập
                </span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onSaveSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="w-5 h-5 accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-dashed border-pink-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" /> Pháo hoa chúc mừng (Confetti)
                </span>
                <input
                  type="checkbox"
                  checked={settings.celebrationEnabled}
                  onChange={(e) => onSaveSettings({ ...settings, celebrationEnabled: e.target.checked })}
                  className="w-5 h-5 accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-dashed border-pink-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-pink-500" /> Chế độ gương camera (Mirrored)
                </span>
                <input
                  type="checkbox"
                  checked={settings.cameraMirrored}
                  onChange={(e) => onSaveSettings({ ...settings, cameraMirrored: e.target.checked })}
                  className="w-5 h-5 accent-pink-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAMERA & GESTURE TEST SUITE */}
      {activeTab === 'test' && (
        <div className="bg-white/95 border-2 border-dashed border-pink-300 rounded-3xl p-6 shadow-sm max-w-5xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b-2 border-dashed border-pink-200 mb-6">
            <div>
              <h2 className="text-lg font-black text-pink-900 flex items-center gap-2 font-['Comfortaa',sans-serif]">
                <Video className="w-5 h-5 text-pink-500" />
                <span>Khu Vực Kiểm Tra Camera & Thử Cử Chỉ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Giáo viên đứng trước camera thực hiện 4 cử chỉ để kiểm tra độ nhạy trước khi trình chiếu cho cả lớp.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Live Camera View */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-dashed border-pink-400 bg-slate-900 shadow-xl flex items-center justify-center">
                <video
                  ref={videoTestRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${settings.cameraMirrored ? 'mirror-mode' : ''}`}
                />
                <canvas
                  ref={canvasTestRef}
                  width={500}
                  height={375}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${settings.cameraMirrored ? 'mirror-mode' : ''}`}
                />

                {/* Status Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-dashed backdrop-blur ${
                    cameraStatus === 'running'
                      ? 'bg-white/90 text-pink-700 border-pink-300 shadow-sm'
                      : cameraStatus === 'error'
                      ? 'bg-rose-900/90 text-white border-rose-400'
                      : 'bg-white/80 text-slate-700 border-slate-300'
                  }`}>
                    {cameraStatus === 'running'
                      ? (testResult.hasPerson ? '● Đã thấy người' : '○ Đang chờ người vào khung hình')
                      : cameraStatus === 'error'
                      ? '✕ Lỗi mở camera'
                      : 'Đang khởi động...'}
                  </span>
                </div>

                {cameraStatus === 'error' && (
                  <div className="absolute inset-0 bg-pink-950/90 flex flex-col items-center justify-center p-6 text-center text-white">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
                    <p className="text-sm font-bold mb-2">Chưa cấp quyền Camera</p>
                    <p className="text-xs text-pink-200 max-w-sm mb-4">{cameraError || 'Vui lòng nhấn Cho phép (Allow) khi trình duyệt hỏi quyền truy cập máy ảnh.'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Gesture test feedback cards */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-pink-800 mb-2">
                Trạng thái 4 cử chỉ hiện tại
              </h3>

              {(['left_hand_up', 'right_hand_up', 'arms_spread', 'both_hands_up'] as GestureType[]).map((g) => {
                const isActive = testResult.detectedGesture === g;
                const meta = GESTURE_LABELS[g];

                return (
                  <div
                    key={g}
                    className={`p-3.5 rounded-2xl border-2 border-dashed transition-all flex items-center justify-between ${
                      isActive
                        ? `bg-pink-100/90 border-pink-400 shadow-md ring-2 ring-pink-300 scale-102`
                        : 'bg-pink-50/50 border-pink-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 rounded-2xl bg-white p-1 border border-dashed border-pink-200">
                        <ChibiAvatar pose={g} className="w-full h-full" />
                      </div>
                      <div>
                        <p className={`font-extrabold text-sm ${isActive ? 'text-pink-900' : 'text-slate-700'}`}>{meta.title}</p>
                        <p className="text-xs text-slate-500">{meta.subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-black ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-white text-slate-400 border border-slate-200'
                      }`}>
                        {isActive ? 'ĐANG NHẬN DIỆN!' : 'Chờ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Quiz Set */}
      {showSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-dashed border-pink-400 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-pink-200">
              <h3 className="text-base font-extrabold text-pink-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-pink-500" />
                <span>{editingSetId ? 'Đổi Tên Bộ Đề' : 'Tạo Bộ Đề Mới'}</span>
              </h3>
              <button
                onClick={() => setShowSetModal(false)}
                className="text-pink-400 hover:text-pink-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSetModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên bộ đề *</label>
                <input
                  type="text"
                  value={setTitle}
                  onChange={(e) => setSetTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn Tập Toán Lớp 3"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 text-sm text-slate-800 focus:outline-none focus:border-pink-400 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề / Danh mục</label>
                <input
                  type="text"
                  value={setCategory}
                  onChange={(e) => setSetCategory(e.target.value)}
                  placeholder="Ví dụ: Toán Học, Khoa Học, Đố Vui"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 text-sm text-slate-800 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={setDescription}
                  onChange={(e) => setSetDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung các câu hỏi..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 text-xs text-slate-800 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSetModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md"
                >
                  {editingSetId ? 'Lưu thay đổi' : 'Tạo bộ đề'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Paste Questions */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border-2 border-dashed border-pink-400 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-pink-200">
              <div>
                <h3 className="text-base font-extrabold text-pink-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  <span>Dán Câu Hỏi Hàng Loạt</span>
                </h3>
                <p className="text-xs text-pink-600 font-bold">Thêm vào bộ đề: {activeSet.title}</p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-pink-400 hover:text-pink-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <pre className="text-[11px] p-3 rounded-2xl bg-pink-50 text-pink-900 font-mono overflow-x-auto border-2 border-dashed border-pink-200">
{`Câu 1: 3 + 5 = ?
A. 7
B. 6
C. 8
D. 9
Đáp án: C

Câu 2: Số lớn hơn 8 là?
A. 6
B. 7
C. 9
D. 5
Đáp án: C`}
            </pre>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Dán nội dung các câu hỏi theo mẫu trên vào đây..."
              className="w-full px-4 py-3 rounded-2xl bg-pink-50 border-2 border-dashed border-pink-200 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 font-mono"
            />

            {bulkError && (
              <p className="text-xs text-rose-500 font-bold">{bulkError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleProcessBulk}
                className="px-6 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md"
              >
                Phân tích & Thêm vào bộ đề
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

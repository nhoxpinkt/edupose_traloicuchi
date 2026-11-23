import { Question, GameSettings } from '../types';

export function generateStandaloneHtml(questions: Question[], settings: GameSettings): string {
  const questionsJson = JSON.stringify(questions, null, 2);
  const settingsJson = JSON.stringify(settings, null, 2);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduPose - Trò Chơi Trắc Nghiệm Cử Chỉ Camera</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #070d1e; color: #f1f5f9; }
    .mirror-mode { transform: scaleX(-1); }
    .glow-cyan { box-shadow: 0 0 25px rgba(6, 182, 212, 0.45); }
    .glow-emerald { box-shadow: 0 0 25px rgba(16, 185, 129, 0.45); }
    .glow-purple { box-shadow: 0 0 25px rgba(168, 85, 247, 0.45); }
    .glow-amber { box-shadow: 0 0 25px rgba(245, 158, 11, 0.45); }
    .glow-green { box-shadow: 0 0 35px rgba(34, 197, 94, 0.6); }
    .glow-red { box-shadow: 0 0 35px rgba(239, 68, 68, 0.6); }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between overflow-x-hidden">
  <div id="app" class="relative w-full max-w-[1500px] mx-auto min-h-screen p-4 flex flex-col justify-between">
    <!-- Standalone self-executing player -->
    <header class="flex items-center justify-between px-6 py-3 rounded-2xl bg-[#0f1b35]/80 backdrop-blur-md border border-slate-700/60 shadow-xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-white text-lg shadow-lg">EP</div>
        <div>
          <h1 class="font-bold text-lg text-white tracking-wide">EduPose Trả Lời Cử Chỉ</h1>
          <p class="text-xs text-cyan-400 font-medium">Bản đóng gói tự động chạy offline 100%</p>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-sm font-semibold px-4 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-blue-300" id="header-progress">Câu: 1 / ${questions.length}</div>
        <div class="text-base font-extrabold px-5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/50 text-amber-400" id="header-score">Điểm: 0</div>
      </div>
    </header>

    <main class="flex-1 flex flex-col justify-center my-4 gap-4">
      <!-- Question Deck -->
      <div class="relative w-full p-6 rounded-3xl bg-[#0f1b35]/90 border border-slate-700 shadow-2xl flex flex-col items-center text-center">
        <span class="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2" id="q-counter">CÂU HỎI 1</span>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white leading-snug max-w-4xl" id="q-title">Đang tải câu hỏi...</h2>
        <div class="w-full max-w-md h-2 rounded-full bg-slate-800 mt-4 overflow-hidden">
          <div id="q-timer-bar" class="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300" style="width: 100%"></div>
        </div>
        <span id="q-timer-text" class="text-xs font-mono mt-1 text-slate-400">15s</span>
      </div>

      <!-- Play Stage (Central Camera + 4 Options) -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <!-- Left Side Cards (A & C) -->
        <div class="md:col-span-3 flex flex-col gap-4">
          <div id="card-A" class="p-4 rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/40 transition-all duration-200">
            <div class="flex items-center justify-between mb-2">
              <span class="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-sm">A</span>
              <span class="text-xs text-cyan-300 font-bold">Tay trái lên</span>
            </div>
            <p id="opt-text-A" class="font-bold text-lg text-white">Đáp án A</p>
          </div>
          <div id="card-C" class="p-4 rounded-2xl bg-purple-950/40 border-2 border-purple-500/40 transition-all duration-200">
            <div class="flex items-center justify-between mb-2">
              <span class="px-3 py-1 rounded-lg bg-purple-500 text-white font-black text-sm">C</span>
              <span class="text-xs text-purple-300 font-bold">Hai tay dang ngang</span>
            </div>
            <p id="opt-text-C" class="font-bold text-lg text-white">Đáp án C</p>
          </div>
        </div>

        <!-- Center Webcam & Pose Skeleton -->
        <div class="md:col-span-6 flex flex-col items-center">
          <div class="relative w-full max-w-[480px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-cyan-500/50 bg-slate-950 shadow-2xl flex items-center justify-center">
            <video id="webcam" autoplay playsinline muted class="absolute inset-0 w-full h-full object-cover mirror-mode"></video>
            <canvas id="pose-canvas" width="480" height="360" class="absolute inset-0 w-full h-full mirror-mode"></canvas>
            <div id="status-pill" class="absolute top-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-white/20 text-xs font-semibold text-cyan-300">Đang nhận diện cử chỉ...</div>
            <div id="hold-container" class="absolute bottom-3 left-4 right-4 bg-slate-900/80 backdrop-blur rounded-xl p-2 border border-white/10 hidden">
              <div class="flex justify-between text-xs text-white mb-1"><span id="hold-label">Giữ cử chỉ...</span><span id="hold-pct">0%</span></div>
              <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden"><div id="hold-bar" class="h-full bg-cyan-400 transition-all duration-75" style="width: 0%"></div></div>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-2">Đứng cách camera 1.5 - 2 mét, giữ cử chỉ 0.8s để chốt đáp án</p>
        </div>

        <!-- Right Side Cards (B & D) -->
        <div class="md:col-span-3 flex flex-col gap-4">
          <div id="card-B" class="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/40 transition-all duration-200">
            <div class="flex items-center justify-between mb-2">
              <span class="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm">B</span>
              <span class="text-xs text-emerald-300 font-bold">Tay phải lên</span>
            </div>
            <p id="opt-text-B" class="font-bold text-lg text-white">Đáp án B</p>
          </div>
          <div id="card-D" class="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/40 transition-all duration-200">
            <div class="flex items-center justify-between mb-2">
              <span class="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-sm">D</span>
              <span class="text-xs text-amber-300 font-bold">Hai tay giơ cao</span>
            </div>
            <p id="opt-text-D" class="font-bold text-lg text-white">Đáp án D</p>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    const questions = ${questionsJson};
    const settings = ${settingsJson};
    let currentIndex = 0;
    let score = 0;
    let timeLeft = 15;
    let timer = null;
    let currentGesture = 'none';
    let holdStartTime = null;

    function renderQuestion() {
      if (currentIndex >= questions.length) {
        alert("Hoàn thành trò chơi! Tổng điểm của bạn: " + score);
        currentIndex = 0;
        score = 0;
      }
      const q = questions[currentIndex];
      document.getElementById('header-progress').textContent = "Câu: " + (currentIndex + 1) + " / " + questions.length;
      document.getElementById('header-score').textContent = "Điểm: " + score;
      document.getElementById('q-counter').textContent = "CÂU HỎI " + (currentIndex + 1);
      document.getElementById('q-title').textContent = q.text;
      document.getElementById('opt-text-A').textContent = q.options.A;
      document.getElementById('opt-text-B').textContent = q.options.B;
      document.getElementById('opt-text-C').textContent = q.options.C;
      document.getElementById('opt-text-D').textContent = q.options.D;

      timeLeft = q.timeLimit || settings.defaultTimeLimit;
      startTimer();
    }

    function startTimer() {
      clearInterval(timer);
      const total = questions[currentIndex].timeLimit || settings.defaultTimeLimit;
      timer = setInterval(() => {
        timeLeft--;
        const pct = Math.max(0, (timeLeft / total) * 100);
        document.getElementById('q-timer-bar').style.width = pct + '%';
        document.getElementById('q-timer-text').textContent = timeLeft + 's';
        if (timeLeft <= 0) {
          clearInterval(timer);
          currentIndex++;
          renderQuestion();
        }
      }, 1000);
    }

    // MediaPipe initialization
    async function initCamera() {
      const video = document.getElementById('webcam');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();

        const pose = new Pose({
          locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + file
        });
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true });
        pose.onResults(onPose);

        const camera = new Camera(video, {
          onFrame: async () => { await pose.send({ image: video }); },
          width: 480, height: 360
        });
        camera.start();
      } catch (err) {
        document.getElementById('status-pill').textContent = "Camera chưa mở: Vui lòng cho phép quyền";
      }
    }

    function onPose(results) {
      if (!results.poseLandmarks) return;
      const lm = results.poseLandmarks;
      const nose = lm[0];
      const lShoulder = lm[11];
      const rShoulder = lm[12];
      const lWrist = lm[15];
      const rWrist = lm[16];

      const lUp = lWrist.y < lShoulder.y - 0.08 && lWrist.y < nose.y;
      const rUp = rWrist.y < rShoulder.y - 0.08 && rWrist.y < nose.y;
      const horizontal = Math.abs(lWrist.y - lShoulder.y) < 0.2 && Math.abs(rWrist.y - rShoulder.y) < 0.2;
      const spread = Math.abs(lWrist.x - rWrist.x) > 0.42;

      let detected = 'none';
      if (lUp && rUp) detected = 'both_hands_up';
      else if (horizontal && spread && !lUp && !rUp) detected = 'arms_spread';
      else if (lUp && !rUp) detected = 'left_hand_up';
      else if (rUp && !lUp) detected = 'right_hand_up';

      updateGesture(detected);
    }

    function updateGesture(g) {
      const pill = document.getElementById('status-pill');
      const holdContainer = document.getElementById('hold-container');
      const holdBar = document.getElementById('hold-bar');

      if (g === 'none') {
        currentGesture = 'none';
        holdStartTime = null;
        holdContainer.classList.add('hidden');
        pill.textContent = "Đang nhận diện cử chỉ...";
        return;
      }

      pill.textContent = "Nhận diện: " + g;
      if (currentGesture !== g) {
        currentGesture = g;
        holdStartTime = Date.now();
      }

      holdContainer.classList.remove('hidden');
      const elapsed = (Date.now() - holdStartTime) / 1000;
      const req = settings.holdDuration || 0.8;
      const progress = Math.min(100, (elapsed / req) * 100);
      holdBar.style.width = progress + '%';

      if (elapsed >= req) {
        holdStartTime = null;
        holdContainer.classList.add('hidden');
        confirmAnswer(g);
      }
    }

    function confirmAnswer(gesture) {
      let selectedOption = null;
      for (const opt of ['A', 'B', 'C', 'D']) {
        if (settings.gestureMapping[opt] === gesture) {
          selectedOption = opt;
          break;
        }
      }
      if (!selectedOption) return;

      const q = questions[currentIndex];
      const isCorrect = selectedOption === q.correctAnswer;
      if (isCorrect) {
        score += q.points || 10;
        if (window.confetti) confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }
      clearInterval(timer);
      setTimeout(() => {
        currentIndex++;
        renderQuestion();
      }, 1200);
    }

    window.onload = () => {
      renderQuestion();
      initCamera();
    };
  </script>
</body>
</html>`;
}

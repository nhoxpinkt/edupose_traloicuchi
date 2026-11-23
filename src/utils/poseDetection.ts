import { GestureType, DetectionResult } from '../types';

export interface Point {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

// Class that manages MediaPipe Pose and Webcam detection
export class PoseDetector {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private poseInstance: any = null;
  private cameraInstance: any = null;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;
  private onResultsCallback: ((result: DetectionResult) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  // Track smoothed gesture to avoid jitter
  private currentDetectedGesture: GestureType = 'none';

  public async initialize(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onResults: (result: DetectionResult) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    this.videoElement = video;
    this.canvasElement = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.onResultsCallback = onResults;
    if (onError) this.onErrorCallback = onError;

    try {
      // 1. Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.stream = stream;
      video.srcObject = stream;
      await video.play();

      // 2. Initialize MediaPipe Pose if available via CDN
      const Pose = (window as any).Pose;
      if (typeof Pose !== 'undefined') {
        const pose = new Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results: any) => {
          this.processPoseResults(results);
        });

        this.poseInstance = pose;

        // Use Camera utils if loaded, or requestVideoFrameCallback / requestAnimationFrame loop
        const Camera = (window as any).Camera;
        if (typeof Camera !== 'undefined') {
          const camera = new Camera(video, {
            onFrame: async () => {
              if (this.isRunning && this.poseInstance && this.videoElement) {
                await this.poseInstance.send({ image: this.videoElement });
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
          this.cameraInstance = camera;
        } else {
          // Manual frame processing loop
          this.startManualLoop();
        }
      } else {
        // Fallback lightweight optical tracking loop if MediaPipe script is still loading
        this.startFallbackLoop();
      }

      this.isRunning = true;
      return true;
    } catch (err: any) {
      console.error('Camera/Pose init error:', err);
      const errMsg = err?.name === 'NotAllowedError'
        ? 'Trình duyệt chưa được cấp quyền truy cập Camera. Vui lòng cho phép Camera để chơi!'
        : (err?.message || 'Không thể mở Camera.');
      if (this.onErrorCallback) this.onErrorCallback(errMsg);
      return false;
    }
  }

  private startManualLoop() {
    const loop = async () => {
      if (!this.isRunning) return;
      if (this.poseInstance && this.videoElement && this.videoElement.readyState >= 2) {
        try {
          await this.poseInstance.send({ image: this.videoElement });
        } catch {
          // continue
        }
      }
      if (this.isRunning) {
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
  }

  private startFallbackLoop() {
    // If MediaPipe takes time, periodically re-check
    const timer = setInterval(() => {
      if ((window as any).Pose && !this.poseInstance && this.videoElement) {
        clearInterval(timer);
        this.initialize(this.videoElement, this.canvasElement!, this.onResultsCallback!, this.onErrorCallback!);
      }
    }, 1000);
  }

  private processPoseResults(results: any) {
    if (!this.canvasElement || !this.canvasCtx) return;
    const ctx = this.canvasCtx;
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
      this.currentDetectedGesture = 'none';
      if (this.onResultsCallback) {
        this.onResultsCallback({
          hasPerson: false,
          detectedGesture: 'none',
          confidence: 0,
        });
      }
      ctx.restore();
      return;
    }

    const lm = results.poseLandmarks;
    const gesture = this.classifyGesture(lm);
    this.currentDetectedGesture = gesture;

    // Draw futuristic neon pose skeleton overlay
    this.drawSkeleton(ctx, lm, width, height, gesture);

    ctx.restore();

    if (this.onResultsCallback) {
      this.onResultsCallback({
        hasPerson: true,
        detectedGesture: gesture,
        confidence: 0.95,
        rawLandmarks: lm,
      });
    }
  }

  // Real-time classification for the 4 core educational gestures
  public classifyGesture(lm: Point[]): GestureType {
    if (!lm || lm.length < 25) return 'none';

    const nose = lm[0];
    const leftShoulder = lm[11];
    const rightShoulder = lm[12];
    const leftWrist = lm[15];
    const rightWrist = lm[16];

    // Visibility check
    const isVisible = (p: Point) => (p.visibility ?? 1) > 0.35;
    if (!isVisible(leftShoulder) || !isVisible(rightShoulder)) {
      return 'none';
    }

    // Shoulder width to normalize distances regardless of student distance from webcam
    const shoulderWidth = Math.max(0.08, Math.abs(leftShoulder.x - rightShoulder.x));
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // A wrist is considered UP if it's noticeably higher than its respective shoulder
    // (Note: in MediaPipe, Y decreases upwards, so smaller Y means higher in the frame)
    const leftWristUp = isVisible(leftWrist) && leftWrist.y < leftShoulder.y - 0.05;
    const rightWristUp = isVisible(rightWrist) && rightWrist.y < rightShoulder.y - 0.05;

    // 1. Both Hands High Up (Hai tay giơ cao) - Option D
    // Both wrists must be raised well above the shoulders
    if (leftWristUp && rightWristUp && leftWrist.y < shoulderMidY - 0.10 && rightWrist.y < shoulderMidY - 0.10) {
      return 'both_hands_up';
    }

    // 2. Both Arms Spread Wide (Hai tay dang ngang) - Option C
    // Both wrists around shoulder height (+/- 22% frame height) and spread outwards wider than shoulders
    const leftArmHorizontal = Math.abs(leftWrist.y - leftShoulder.y) < 0.22;
    const rightArmHorizontal = Math.abs(rightWrist.y - rightShoulder.y) < 0.22;
    const wristDistance = Math.abs(leftWrist.x - rightWrist.x);
    const isSpreadWide = wristDistance > shoulderWidth * 1.55;

    if (!leftWristUp && !rightWristUp && leftArmHorizontal && rightArmHorizontal && isSpreadWide) {
      return 'arms_spread';
    }

    // 3. User's Left Hand Up (Tay trái lên) - Option A
    // Left hand is up, right hand is down
    if (leftWristUp && !rightWristUp) {
      return 'left_hand_up';
    }

    // 4. User's Right Hand Up (Tay phải lên) - Option B
    // Right hand is up, left hand is down
    if (rightWristUp && !leftWristUp) {
      return 'right_hand_up';
    }

    return 'none';
  }

  // Draw glowing futuristic skeletal joints & connections
  private drawSkeleton(
    ctx: CanvasRenderingContext2D,
    lm: Point[],
    width: number,
    height: number,
    gesture: GestureType
  ) {
    // Choose cute pastel neon color based on active gesture
    let strokeColor = 'rgba(244, 114, 182, 0.8)'; // default cute pink
    let jointColor = '#ec4899';

    if (gesture === 'left_hand_up') {
      strokeColor = 'rgba(56, 189, 248, 0.95)'; // Sky blue
      jointColor = '#38bdf8';
    } else if (gesture === 'right_hand_up') {
      strokeColor = 'rgba(52, 211, 153, 0.95)'; // Mint green
      jointColor = '#34d399';
    } else if (gesture === 'arms_spread') {
      strokeColor = 'rgba(192, 132, 252, 0.95)'; // Lavender
      jointColor = '#c084fc';
    } else if (gesture === 'both_hands_up') {
      strokeColor = 'rgba(251, 113, 133, 0.95)'; // Rose pink
      jointColor = '#fb7185';
    }

    // Skeleton bone connections (Indices from MediaPipe)
    const connections: [number, number][] = [
      [11, 12], // shoulders
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], [23, 24], // torso
    ];

    ctx.lineWidth = 4;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 12;
    ctx.shadowColor = jointColor;

    // Draw bones
    for (const [i, j] of connections) {
      if (lm[i] && lm[j] && (lm[i].visibility ?? 1) > 0.4 && (lm[j].visibility ?? 1) > 0.4) {
        ctx.beginPath();
        // In mirrored video, coordinate x is drawn directly to match mirrored canvas
        ctx.moveTo(lm[i].x * width, lm[i].y * height);
        ctx.lineTo(lm[j].x * width, lm[j].y * height);
        ctx.stroke();
      }
    }

    // Draw joints
    const keyJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24];
    for (const idx of keyJoints) {
      const p = lm[idx];
      if (p && (p.visibility ?? 1) > 0.4) {
        const radius = (idx === 15 || idx === 16) ? 7 : (idx === 0 ? 5 : 6);
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, radius, 0, Math.PI * 2);
        ctx.fillStyle = jointColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.cameraInstance) {
      try { this.cameraInstance.stop(); } catch {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}

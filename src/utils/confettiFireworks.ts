import confetti from 'canvas-confetti';

// Celebratory Confetti Fireworks Suite for classroom excitement
export function triggerCorrectFireworks() {
  const cuteColors = ['#f472b6', '#fb7185', '#ec4899', '#fde047', '#38bdf8', '#34d399', '#c084fc'];

  // Left corner cannon burst
  confetti({
    particleCount: 65,
    angle: 60,
    spread: 60,
    origin: { x: 0.1, y: 0.85 },
    colors: cuteColors,
    startVelocity: 45,
    scalar: 1.1,
  });

  // Right corner cannon burst
  confetti({
    particleCount: 65,
    angle: 120,
    spread: 60,
    origin: { x: 0.9, y: 0.85 },
    colors: cuteColors,
    startVelocity: 45,
    scalar: 1.1,
  });

  // Central star & heart fountain burst
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { x: 0.5, y: 0.45 },
      colors: cuteColors,
      ticks: 200,
      gravity: 0.9,
      scalar: 1.25,
    });
  }, 150);

  // Sparkling shower cascade
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 90,
      spread: 120,
      origin: { x: 0.5, y: 0.3 },
      colors: ['#fde047', '#f472b6', '#ffffff', '#fb7185'],
      startVelocity: 25,
      gravity: 0.7,
      ticks: 180,
    });
  }, 350);
}

export function triggerGrandFinaleFireworks() {
  const cuteColors = ['#f472b6', '#fb7185', '#ec4899', '#fde047', '#38bdf8', '#34d399', '#c084fc'];
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: cuteColors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: cuteColors,
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  // Grand center burst
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 140,
      origin: { x: 0.5, y: 0.5 },
      colors: cuteColors,
      scalar: 1.3,
    });
  }, 600);
}

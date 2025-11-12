import confetti from "canvas-confetti";
import type { Options as ConfettiOptions } from "canvas-confetti";

type FireworksOptions = {
  duration?: number;
  intervalDelay?: number;
  defaults?: ConfettiOptions;
};

export function triggerConfettiFireworks({
  duration = 1_000,
  intervalDelay = 200,
  defaults,
}: FireworksOptions = {}) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const animationEnd = Date.now() + duration;
  const baseDefaults: ConfettiOptions = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
    ...defaults,
  };

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  // 初始爆发效果 - 从多个位置同时发射
  const initialBurst = () => {
    const count = 200;
    const defaults = {
      particleCount: count,
      startVelocity: 45,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
    };

    // 从屏幕中央和两侧发射
    confetti({
      ...defaults,
      origin: { x: 0.5, y: 0.5 },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
    });
    confetti({
      ...defaults,
      origin: { x: 0.2, y: 0.5 },
      colors: ["#FF6B6B", "#4ECDC4", "#FFD700"],
    });
    confetti({
      ...defaults,
      origin: { x: 0.8, y: 0.5 },
      colors: ["#45B7D1", "#FFA07A", "#FFD700"],
    });
  };

  // 立即触发初始爆发
  initialBurst();

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }

    const particleCount = Math.floor(80 * (timeLeft / duration));

    confetti({
      ...baseDefaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
    });
    confetti({
      ...baseDefaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ["#FF6B6B", "#4ECDC4", "#FFD700", "#45B7D1"],
    });
    // 从中央也发射
    confetti({
      ...baseDefaults,
      particleCount: Math.floor(particleCount * 0.5),
      origin: { x: 0.5, y: Math.random() - 0.2 },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4"],
    });
  }, intervalDelay);

  return () => window.clearInterval(interval);
}



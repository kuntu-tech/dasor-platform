import { useEffect, useRef } from "react";

// 由于依赖安装问题，我们暂时创建一个简化版本的Prism组件
// 您稍后可以安装ogl依赖后替换为完整版本

const Prism = ({
  height = 3.5,
  baseWidth = 5.5,
  animationType = "rotate",
  glow = 1,
  offset = { x: 0, y: 0 },
  noise = 0.5,
  transparent = true,
  scale = 3.6,
  hueShift = 0,
  colorFrequency = 1,
  hoverStrength = 2,
  inertia = 0.05,
  bloom = 1,
  suspendWhenOffscreen = false,
  timeScale = 0.5,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 创建一个临时的渐变背景作为占位符
    // 等安装ogl依赖后可以替换为完整的WebGL实现
    const gradientDiv = document.createElement('div');
    gradientDiv.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, 
        rgba(59, 130, 246, 0.1) 0%, 
        rgba(147, 51, 234, 0.1) 50%, 
        rgba(236, 72, 153, 0.1) 100%);
      animation: prism-animation 8s ease-in-out infinite;
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes prism-animation {
        0%, 100% { 
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(147, 51, 234, 0.1) 50%, 
            rgba(236, 72, 153, 0.1) 100%);
        }
        50% { 
          background: linear-gradient(135deg, 
            rgba(236, 72, 153, 0.1) 0%, 
            rgba(59, 130, 246, 0.1) 50%, 
            rgba(147, 51, 234, 0.1) 100%);
        }
      }
    `;
    document.head.appendChild(style);

    container.appendChild(gradientDiv);

    return () => {
      if (gradientDiv.parentElement === container) {
        container.removeChild(gradientDiv);
      }
      if (style.parentElement === document.head) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return <div className="w-full h-full relative" ref={containerRef} />;
};

export default Prism;

import React, { useEffect, useRef } from "react";

const DigitalVaultAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation state
    let time = 0;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }> = [];

    // Code flow particles
    const codeChars = ["₿", "€", "$", "¥", "£", "₹", "₩", "₽"];
    const codeParticles: Array<{
      x: number;
      y: number;
      char: string;
      opacity: number;
      speed: number;
    }> = [];

    // Initialize code particles
    for (let i = 0; i < 15; i++) {
      codeParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        char: codeChars[Math.floor(Math.random() * codeChars.length)],
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }

    // Vault particles
    const createParticle = (x: number, y: number) => {
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 255,
        maxLife: 255,
        size: Math.random() * 3 + 1,
      };
    };

    // Initialize some particles
    for (let i = 0; i < 20; i++) {
      particles.push(createParticle(Math.random() * 800, Math.random() * 600));
    }

    const animate = () => {
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with a subtle dark background
      ctx.fillStyle = "rgba(3, 7, 18, 0.1)";
      ctx.fillRect(0, 0, width, height);

      time += 0.01;

      // Draw flowing currency symbols
      ctx.save();
      codeParticles.forEach((particle, index) => {
        particle.y -= particle.speed;
        particle.opacity = Math.sin(time * 2 + index) * 0.3 + 0.4;

        if (particle.y < -20) {
          particle.y = height + 20;
          particle.x = Math.random() * width;
        }

        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
        ctx.font = "16px monospace";
        ctx.fillText(particle.char, particle.x, particle.y);
      });
      ctx.restore();

      // Draw connecting lines between particles
      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1;
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
      ctx.restore();

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Reset particle if life is over
        if (particle.life <= 0) {
          particles[index] = createParticle(
            Math.random() * width,
            Math.random() * height
          );
        }

        // Draw particle
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
};

export default DigitalVaultAnimation;

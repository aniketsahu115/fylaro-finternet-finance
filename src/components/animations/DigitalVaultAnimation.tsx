import React, { useEffect, useRef } from 'react';

const DigitalVaultAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation state
    let time = 0;
    let vaultOpenProgress = 0;
    let keyRotation = 0;
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
    const codeChars = ['0', '1', '{', '}', '<', '>', '/', '*', '+', '-', '=', ';'];
    const codeParticles: Array<{
      x: number;
      y: number;
      char: string;
      opacity: number;
      speed: number;
    }> = [];

    // Initialize code particles
    for (let i = 0; i < 30; i++) {
      codeParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        char: codeChars[Math.floor(Math.random() * codeChars.length)],
        opacity: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 2 + 1
      });
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      ctx.clearRect(0, 0, width, height);
      
      time += 0.016;
      
      // Update vault opening progress (opens slowly over 3 seconds, then cycles)
      const cycleTime = 6; // 6 seconds total cycle
      const openTime = 3; // 3 seconds to open
      const cycleProgress = (time % cycleTime) / cycleTime;
      
      if (cycleProgress < 0.5) {
        // Opening phase
        vaultOpenProgress = Math.min(1, (time % cycleTime) / openTime);
      } else {
        // Closing phase
        vaultOpenProgress = Math.max(0, 1 - ((time % cycleTime) - openTime) / openTime);
      }
      
      keyRotation = time * 2;

      // Draw code flow background
      ctx.save();
      codeParticles.forEach((particle, index) => {
        particle.y -= particle.speed;
        if (particle.y < -20) {
          particle.y = height + 20;
          particle.x = Math.random() * width;
        }
        
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity * 0.3})`;
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText(particle.char, particle.x, particle.y);
      });
      ctx.restore();

      // Draw vault base (main body)
      const centerX = width / 2;
      const centerY = height / 2;
      const vaultWidth = Math.min(width, height) * 0.4;
      const vaultHeight = vaultWidth * 0.8;

      // Vault shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(centerX - vaultWidth/2 + 5, centerY - vaultHeight/2 + 5, vaultWidth, vaultHeight);
      ctx.restore();

      // Main vault body
      const gradient = ctx.createLinearGradient(
        centerX - vaultWidth/2, centerY - vaultHeight/2,
        centerX + vaultWidth/2, centerY + vaultHeight/2
      );
      gradient.addColorStop(0, '#1f2937');
      gradient.addColorStop(0.5, '#374151');
      gradient.addColorStop(1, '#111827');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - vaultWidth/2, centerY - vaultHeight/2, vaultWidth, vaultHeight);

      // Vault door
      const doorWidth = vaultWidth * 0.9;
      const doorHeight = vaultHeight * 0.9;
      const doorX = centerX - doorWidth/2;
      const doorY = centerY - doorHeight/2;

      // Door background
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(vaultOpenProgress * Math.PI * 0.3); // Opens with rotation
      ctx.translate(-centerX, -centerY);

      const doorGradient = ctx.createLinearGradient(doorX, doorY, doorX + doorWidth, doorY + doorHeight);
      doorGradient.addColorStop(0, '#4b5563');
      doorGradient.addColorStop(0.5, '#6b7280');
      doorGradient.addColorStop(1, '#374151');
      
      ctx.fillStyle = doorGradient;
      ctx.fillRect(doorX, doorY, doorWidth, doorHeight);

      // Door details
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.strokeRect(doorX + 20, doorY + 20, doorWidth - 40, doorHeight - 40);
      
      // Lock mechanism
      const lockRadius = Math.min(doorWidth, doorHeight) * 0.15;
      const lockX = centerX + doorWidth * 0.2;
      const lockY = centerY;

      // Lock outer ring
      ctx.beginPath();
      ctx.arc(lockX, lockY, lockRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1f2937';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Lock inner mechanism
      ctx.save();
      ctx.translate(lockX, lockY);
      ctx.rotate(keyRotation);
      
      // Key spokes
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 8);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(lockRadius * 0.7, 0);
        ctx.stroke();
        ctx.restore();
      }
      
      ctx.restore();
      ctx.restore();

      // Glowing effects when vault is opening
      if (vaultOpenProgress > 0.1) {
        // Inner glow
        const glowIntensity = Math.sin(time * 4) * 0.3 + 0.7;
        const glowGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, vaultWidth * 0.6
        );
        glowGradient.addColorStop(0, `rgba(251, 191, 36, ${0.6 * vaultOpenProgress * glowIntensity})`);
        glowGradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.3 * vaultOpenProgress * glowIntensity})`);
        glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, width, height);

        // Add particles when vault is open
        if (vaultOpenProgress > 0.5 && particles.length < 20) {
          particles.push({
            x: centerX + (Math.random() - 0.5) * doorWidth * 0.5,
            y: centerY + (Math.random() - 0.5) * doorHeight * 0.5,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 60,
            maxLife: 60,
            size: Math.random() * 3 + 1
          });
        }
      }

      // Update and draw security particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;

        if (particle.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Security status text
      ctx.save();
      ctx.fillStyle = vaultOpenProgress > 0.8 ? '#10b981' : '#fbbf24';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      const statusText = vaultOpenProgress > 0.8 ? 'VAULT UNLOCKED' : 
                        vaultOpenProgress > 0.3 ? 'AUTHENTICATING...' : 'SECURE';
      ctx.fillText(statusText, centerX, centerY + vaultHeight/2 + 40);
      ctx.restore();

      // Blockchain keys floating
      if (vaultOpenProgress > 0.2) {
        const keySize = 20;
        for (let i = 0; i < 3; i++) {
          const angle = time * 0.5 + (i * Math.PI * 2) / 3;
          const radius = 80 + Math.sin(time * 2 + i) * 20;
          const keyX = centerX + Math.cos(angle) * radius;
          const keyY = centerY + Math.sin(angle) * radius;
          
          ctx.save();
          ctx.translate(keyX, keyY);
          ctx.rotate(angle + time);
          
          // Key glow
          const keyGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, keySize);
          keyGlow.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
          keyGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
          ctx.fillStyle = keyGlow;
          ctx.fillRect(-keySize, -keySize, keySize * 2, keySize * 2);
          
          // Key body
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(-keySize/3, -keySize/2, keySize/6, keySize);
          ctx.fillRect(-keySize/2, -keySize/2, keySize/3, keySize/4);
          
          ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
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
        style={{ background: 'transparent' }}
      />
    </div>
  );
};

export default DigitalVaultAnimation;

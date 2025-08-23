import React, { useEffect, useRef, useState } from 'react';

interface Block {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  glow: number;
  hasData: boolean;
  dataProgress: number;
  validated: boolean;
  validationProgress: number;
  size: number;
  rotation: number;
  pulsePhase: number;
  transactions: number;
}

interface DataParticle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  fromBlock: number;
  toBlock: number;
  opacity: number;
  type: 'data' | 'validation' | 'transaction';
  speed: number;
  trail: { x: number; y: number }[];
}

interface NetworkNode {
  x: number;
  y: number;
  connections: number[];
  activity: number;
  pulsePhase: number;
}

const BinanceBlockchainAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const blocksRef = useRef<Block[]>([]);
  const dataParticlesRef = useRef<DataParticle[]>([]);
  const networkNodesRef = useRef<NetworkNode[]>([]);
  const lastTimeRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(true);

  // Enhanced Binance brand colors
  const colors = {
    binanceYellow: '#F0B90B',
    binanceYellowGlow: '#F0B90B',
    binanceYellowDark: '#D4A307',
    dataBlue: '#0052FF',
    dataBlueDark: '#003DB8',
    networkGreen: '#00D4AA',
    networkGreenDark: '#00B894',
    background: '#0B0E11',
    backgroundAlt: '#161A1E',
    blockBase: '#1E2329',
    blockActive: '#2B3139',
    connectionLine: '#2B3139',
    connectionActive: '#F0B90B',
    textPrimary: '#FAFAFA',
    textSecondary: '#B7BDC6'
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with high DPI support
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize blockchain network
    const initializeNetwork = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Main blockchain blocks
      const blockCount = 6;
      const spacing = width / (blockCount + 1);
      const centerY = height / 2;
      
      blocksRef.current = Array.from({ length: blockCount }, (_, i) => ({
        id: i,
        x: spacing * (i + 1),
        y: centerY + Math.sin(i * 0.8) * 40,
        targetX: spacing * (i + 1),
        targetY: centerY + Math.sin(i * 0.8) * 40,
        glow: Math.random() * 0.5 + 0.5,
        hasData: i === 0,
        dataProgress: i === 0 ? 1 : 0,
        validated: i < 2,
        validationProgress: i < 2 ? 1 : 0,
        size: 50 + Math.random() * 10,
        rotation: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        transactions: Math.floor(Math.random() * 1000)
      }));

      // Network nodes for decentralized visualization
      networkNodesRef.current = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.3;
        return {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          connections: [
            (i + 1) % 12,
            (i + 2) % 12,
            (i + 11) % 12
          ],
          activity: Math.random(),
          pulsePhase: Math.random() * Math.PI * 2
        };
      });
    };

    initializeNetwork();

    // Animation loop
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (!isVisible) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const container = canvas.parentElement;
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;

      ctx.clearRect(0, 0, width, height);

      // Draw animated background
      drawAnimatedBackground(ctx, width, height, currentTime);

      // Draw network nodes and connections
      drawNetworkNodes(ctx, currentTime);

      // Draw main blockchain
      drawConnections(ctx, currentTime);
      updateBlocks(deltaTime, currentTime);
      drawBlocks(ctx, currentTime);

      // Update and draw data particles
      updateDataParticles(deltaTime);
      drawDataParticles(ctx, currentTime);

      // Create new particles periodically
      if (Math.random() < 0.03) {
        createDataParticle(Math.random() > 0.7 ? 'validation' : 'data');
      }

      // Create transaction particles
      if (Math.random() < 0.02) {
        createDataParticle('transaction');
      }

      // Validate blocks periodically
      if (Math.random() < 0.008) {
        validateRandomBlock();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const drawAnimatedBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      // Primary background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, colors.background);
      gradient.addColorStop(0.5, colors.backgroundAlt);
      gradient.addColorStop(1, colors.background);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Animated grid
      ctx.strokeStyle = `rgba(240, 185, 11, 0.1)`;
      ctx.lineWidth = 1;
      const gridSize = 50;
      const offsetX = (time * 0.02) % gridSize;
      const offsetY = (time * 0.01) % gridSize;

      for (let x = -gridSize + offsetX; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = -gridSize + offsetY; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawNetworkNodes = (ctx: CanvasRenderingContext2D, time: number) => {
      const nodes = networkNodesRef.current;
      
      // Draw connections between nodes
      nodes.forEach((node, i) => {
        node.connections.forEach(connIndex => {
          const targetNode = nodes[connIndex];
          if (!targetNode) return;

          const activity = (Math.sin(time * 0.003 + node.pulsePhase) + 1) * 0.5;
          ctx.strokeStyle = `rgba(0, 212, 170, ${0.1 + activity * 0.2})`;
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
        });

        // Update activity
        node.activity += (Math.sin(time * 0.005 + node.pulsePhase) * 0.1);
        node.activity = Math.max(0, Math.min(1, node.activity));
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        const pulse = (Math.sin(time * 0.01 + node.pulsePhase) + 1) * 0.5;
        const size = 3 + pulse * 2;
        
        ctx.fillStyle = `rgba(0, 212, 170, ${0.3 + node.activity * 0.5})`;
        ctx.shadowColor = colors.networkGreen;
        ctx.shadowBlur = 8 * node.activity;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
      });
    };

    const drawConnections = (ctx: CanvasRenderingContext2D, time: number) => {
      const blocks = blocksRef.current;
      
      for (let i = 0; i < blocks.length - 1; i++) {
        const current = blocks[i];
        const next = blocks[i + 1];
        
        // Main connection line
        const activity = (Math.sin(time * 0.004 + i) + 1) * 0.5;
        const lineWidth = 3 + activity * 2;
        
        ctx.beginPath();
        ctx.moveTo(current.x + current.size/2, current.y);
        ctx.lineTo(next.x - next.size/2, next.y);
        
        // Animated gradient for connection
        const gradient = ctx.createLinearGradient(current.x, current.y, next.x, next.y);
        gradient.addColorStop(0, `rgba(240, 185, 11, ${0.4 + activity * 0.4})`);
        gradient.addColorStop(0.5, `rgba(0, 82, 255, ${0.6 + activity * 0.3})`);
        gradient.addColorStop(1, `rgba(240, 185, 11, ${0.4 + activity * 0.4})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        
        // Add flowing animation
        const flowOffset = (time * 0.002) % 1;
        const flowGradient = ctx.createLinearGradient(current.x, current.y, next.x, next.y);
        flowGradient.addColorStop(Math.max(0, flowOffset - 0.1), 'rgba(240, 185, 11, 0)');
        flowGradient.addColorStop(flowOffset, 'rgba(240, 185, 11, 0.8)');
        flowGradient.addColorStop(Math.min(1, flowOffset + 0.1), 'rgba(240, 185, 11, 0)');
        
        ctx.strokeStyle = flowGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const updateBlocks = (deltaTime: number, time: number) => {
      blocksRef.current.forEach((block, index) => {
        // Organic floating animation
        const floatAmplitude = 15;
        const floatSpeed = 0.001;
        block.targetY += Math.sin(time * floatSpeed + index * 0.7) * 0.3;
        
        // Smooth movement
        block.x += (block.targetX - block.x) * 0.05;
        block.y += (block.targetY - block.y) * 0.05;
        
        // Rotate blocks slightly
        block.rotation += 0.002;
        
        // Update glow based on activity
        block.glow = 0.5 + Math.sin(time * 0.003 + index) * 0.3;
        
        // Update pulse phase
        block.pulsePhase += 0.05;
        
        // Update validation progress
        if (block.validated && block.validationProgress < 1) {
          block.validationProgress += deltaTime * 0.001;
          block.validationProgress = Math.min(1, block.validationProgress);
        }

        // Simulate transaction activity
        if (Math.random() < 0.01) {
          block.transactions += Math.floor(Math.random() * 5) + 1;
        }
      });
    };

    const drawBlocks = (ctx: CanvasRenderingContext2D, time: number) => {
      blocksRef.current.forEach((block, index) => {
        ctx.save();
        ctx.translate(block.x, block.y);
        ctx.rotate(Math.sin(time * 0.001 + index) * 0.1);
        
        const pulse = Math.sin(block.pulsePhase) * 0.3 + 0.7;
        const glowIntensity = block.glow * pulse;
        
        // Outer glow
        ctx.shadowColor = colors.binanceYellowGlow;
        ctx.shadowBlur = 30 * glowIntensity;
        
        // Main block with gradient
        const blockGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, block.size/2);
        blockGradient.addColorStop(0, colors.blockActive);
        blockGradient.addColorStop(0.7, colors.blockBase);
        blockGradient.addColorStop(1, colors.background);
        
        ctx.fillStyle = blockGradient;
        ctx.strokeStyle = `rgba(240, 185, 11, ${0.6 + glowIntensity * 0.4})`;
        ctx.lineWidth = 3;
        
        const cornerRadius = 12;
        ctx.beginPath();
        ctx.roundRect(-block.size/2, -block.size/2, block.size, block.size, cornerRadius);
        ctx.fill();
        ctx.stroke();
        
        // Inner details
        ctx.shadowBlur = 0;
        
        // Data activity indicator
        if (block.hasData) {
          const dataSize = 6 + Math.sin(time * 0.01) * 3;
          ctx.fillStyle = colors.dataBlue;
          ctx.shadowColor = colors.dataBlue;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(-block.size/4, -block.size/4, dataSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        // Validation indicator (without text)
        if (block.validated && block.validationProgress > 0) {
          ctx.shadowColor = colors.binanceYellowGlow;
          ctx.shadowBlur = 5 * block.validationProgress;
          
          // Draw validation dot
          ctx.fillStyle = `rgba(240, 185, 11, ${block.validationProgress})`;
          ctx.beginPath();
          ctx.arc(block.size/4, -block.size/4, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }        // Transaction activity lines
        ctx.strokeStyle = `rgba(0, 212, 170, ${0.4 + glowIntensity * 0.3})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const lineAlpha = (Math.sin(time * 0.01 + i) + 1) * 0.5;
          ctx.strokeStyle = `rgba(0, 212, 170, ${lineAlpha * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(-block.size/3, -block.size/4 + i * 6);
          ctx.lineTo(block.size/3, -block.size/4 + i * 6);
          ctx.stroke();
        }
        
        // Block hash visualization
        ctx.fillStyle = `rgba(183, 189, 198, 0.6)`;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`#${block.id.toString().padStart(3, '0')}`, 0, block.size/3);
        
        ctx.restore();
      });
    };

    const createDataParticle = (type: 'data' | 'validation' | 'transaction' = 'data') => {
      const blocks = blocksRef.current;
      if (blocks.length < 2) return;
      
      const fromIndex = Math.floor(Math.random() * (blocks.length - 1));
      const toIndex = fromIndex + 1;
      const fromBlock = blocks[fromIndex];
      const toBlock = blocks[toIndex];
      
      dataParticlesRef.current.push({
        id: Date.now() + Math.random(),
        x: fromBlock.x,
        y: fromBlock.y,
        targetX: toBlock.x,
        targetY: toBlock.y,
        progress: 0,
        fromBlock: fromIndex,
        toBlock: toIndex,
        opacity: 1,
        type,
        speed: 0.8 + Math.random() * 0.4,
        trail: []
      });
    };

    const updateDataParticles = (deltaTime: number) => {
      dataParticlesRef.current = dataParticlesRef.current.filter(particle => {
        particle.progress += deltaTime * 0.001 * particle.speed;
        
        if (particle.progress >= 1) {
          // Particle reached destination
          const targetBlock = blocksRef.current[particle.toBlock];
          if (targetBlock) {
            targetBlock.hasData = true;
            targetBlock.dataProgress = 1;
            
            if (particle.type === 'validation') {
              targetBlock.validated = true;
              targetBlock.validationProgress = 0;
            }
          }
          return false;
        }
        
        // Update position with curved path
        const easeProgress = 1 - Math.pow(1 - particle.progress, 2);
        const fromBlock = blocksRef.current[particle.fromBlock];
        const toBlock = blocksRef.current[particle.toBlock];
        
        if (fromBlock && toBlock) {
          // Bezier curve for more organic movement
          const midX = (fromBlock.x + toBlock.x) / 2;
          const midY = (fromBlock.y + toBlock.y) / 2 - 30;
          
          const t = easeProgress;
          particle.x = Math.pow(1-t, 2) * fromBlock.x + 2*(1-t)*t * midX + Math.pow(t, 2) * toBlock.x;
          particle.y = Math.pow(1-t, 2) * fromBlock.y + 2*(1-t)*t * midY + Math.pow(t, 2) * toBlock.y;
          
          // Update trail
          particle.trail.unshift({ x: particle.x, y: particle.y });
          if (particle.trail.length > 8) {
            particle.trail.pop();
          }
        }
        
        return true;
      });
    };

    const drawDataParticles = (ctx: CanvasRenderingContext2D, time: number) => {
      dataParticlesRef.current.forEach(particle => {
        ctx.save();
        
        const color = particle.type === 'validation' ? colors.binanceYellow :
                     particle.type === 'transaction' ? colors.dataBlue :
                     colors.networkGreen;
        
        // Draw trail
        particle.trail.forEach((point, index) => {
          const trailAlpha = (1 - index / particle.trail.length) * particle.opacity * 0.6;
          const trailSize = (1 - index / particle.trail.length) * 3;
          
          ctx.fillStyle = `rgba(${color === colors.binanceYellow ? '240, 185, 11' : 
                                 color === colors.dataBlue ? '0, 82, 255' : 
                                 '0, 212, 170'}, ${trailAlpha})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Main particle with pulsing glow
        const pulse = Math.sin(time * 0.02) * 0.5 + 0.5;
        const size = 4 + pulse * 2;
        
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 + pulse * 10;
        ctx.fillStyle = color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle effect for validation particles
        if (particle.type === 'validation') {
          for (let i = 0; i < 4; i++) {
            const angle = (time * 0.01 + i * Math.PI / 2);
            const sparkleX = particle.x + Math.cos(angle) * 8;
            const sparkleY = particle.y + Math.sin(angle) * 8;
            
            ctx.fillStyle = `rgba(240, 185, 11, ${pulse * 0.8})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.restore();
      });
    };

    const validateRandomBlock = () => {
      const unvalidatedBlocks = blocksRef.current.filter(block => !block.validated);
      if (unvalidatedBlocks.length > 0) {
        const randomBlock = unvalidatedBlocks[Math.floor(Math.random() * unvalidatedBlocks.length)];
        randomBlock.validated = true;
        randomBlock.validationProgress = 0;
      }
    };

    // Intersection Observer for performance
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Enhanced overlay elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top indicators */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-yellow-400/80 font-medium">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
            <span>Binance Smart Chain</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-400/70">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Cross-chain Validation</span>
          </div>
        </div>
        
        {/* Bottom indicators */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-green-400/80 font-medium">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <span>Real-time Settlement</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400/60">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <span>Decentralized Network</span>
          </div>
        </div>
        
        {/* Performance metrics */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 text-right">
          <div className="text-xs text-yellow-400/70">
            <span className="text-yellow-400 font-mono font-bold">99.9%</span> Uptime
          </div>
          <div className="text-xs text-green-400/70">
            <span className="text-green-400 font-mono font-bold">&lt;3s</span> Settlement
          </div>
          <div className="text-xs text-blue-400/70">
            <span className="text-blue-400 font-mono font-bold">1M+</span> TPS
          </div>
        </div>
        
        {/* Security indicator */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 text-xs text-yellow-400/60">
          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 1L5 4v6c0 5.55 3.84 10.74 9.09 12 .93-.22 1.91-.71 2.91-1.49V4l-5-3z" clipRule="evenodd" />
          </svg>
          <span>Bank-grade Security</span>
        </div>
      </div>
    </div>
  );
};

export default BinanceBlockchainAnimation;

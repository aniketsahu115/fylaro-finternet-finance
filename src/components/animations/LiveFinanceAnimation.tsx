import React, { useEffect, useRef, useState } from "react";

interface FinanceNode {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  value: number;
  glow: number;
  pulsePhase: number;
  activity: number;
  connections: number[];
  trail: { x: number; y: number; opacity: number }[];
}

interface DataFlow {
  id: number;
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  particles: { x: number; y: number; opacity: number; size: number }[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

const LiveFinanceAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const nodesRef = useRef<FinanceNode[]>([]);
  const flowsRef = useRef<DataFlow[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  // Finance sector colors matching the image
  const sectors = [
    { name: "Trade Finance", color: "#F0B90B", value: 85 }, // Yellow
    { name: "Supply Chain Finance", color: "#3B82F6", value: 92 }, // Blue
    { name: "Working Capital", color: "#10B981", value: 78 }, // Green/Cyan
    { name: "Export Finance", color: "#F97316", value: 88 }, // Orange
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI support
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";

        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse tracking for interactivity
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    // Initialize finance nodes
    const initializeNodes = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      nodesRef.current = sectors.map((sector, i) => {
        // Spread nodes across the canvas with some randomness
        const angle = (i / sectors.length) * Math.PI * 2 + Math.random() * 0.5;
        const radiusVariation = 0.2 + Math.random() * 0.15;
        const centerRadius = Math.min(width, height) * radiusVariation;

        return {
          id: i,
          x: width * 0.2 + Math.random() * (width * 0.6),
          y: height * 0.2 + Math.random() * (height * 0.6),
          targetX: width / 2 + Math.cos(angle) * centerRadius,
          targetY: height / 2 + Math.sin(angle) * centerRadius,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 20 + sector.value * 0.3,
          color: sector.color,
          label: sector.name,
          value: sector.value,
          glow: 0.5 + Math.random() * 0.5,
          pulsePhase: Math.random() * Math.PI * 2,
          activity: Math.random(),
          connections:
            i < sectors.length - 1 ? [i + 1, (i + 2) % sectors.length] : [0],
          trail: [],
        };
      });

      // Add some floating particles
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 1,
          maxLife: 1,
          size: Math.random() * 3 + 1,
          color: sectors[Math.floor(Math.random() * sectors.length)].color,
          opacity: 0.3 + Math.random() * 0.4,
        });
      }
    };

    initializeNodes();

    // Animation loop
    const animate = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTimeRef.current, 50);
      lastTimeRef.current = currentTime;

      if (!isVisible) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const container = canvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Clear with dark background
      ctx.fillStyle = "#0B0E11";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      drawGrid(ctx, width, height, currentTime);

      // Update and draw connections between nodes
      drawConnections(ctx, currentTime);

      // Update and draw nodes
      updateNodes(deltaTime, currentTime, width, height);
      drawNodes(ctx, currentTime);

      // Update and draw data flows
      updateDataFlows(deltaTime);
      drawDataFlows(ctx);

      // Update and draw ambient particles
      updateParticles(deltaTime, width, height);
      drawParticles(ctx);

      // Create new flows periodically
      if (Math.random() < 0.02) {
        createDataFlow();
      }

      // Draw legend
      drawLegend(ctx, width, height);

      // Draw title overlay
      drawTitle(ctx, width);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const drawGrid = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      time: number
    ) => {
      ctx.strokeStyle = "#1F2937";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.15;

      const gridSize = 50;
      const offset = (time * 0.01) % gridSize;

      for (let x = -offset; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = -offset; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    const updateNodes = (
      deltaTime: number,
      time: number,
      width: number,
      height: number
    ) => {
      nodesRef.current.forEach((node) => {
        // Update pulse animation
        node.pulsePhase += 0.02;
        node.glow = 0.5 + Math.sin(node.pulsePhase) * 0.5;
        node.activity = 0.3 + Math.sin(time * 0.001 + node.id) * 0.3;

        // Gentle floating motion
        const centerX = width / 2;
        const centerY = height / 2;
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Attraction to center with some randomness
        node.vx += (dx / dist) * 0.001 + (Math.random() - 0.5) * 0.01;
        node.vy += (dy / dist) * 0.001 + (Math.random() - 0.5) * 0.01;

        // Mouse interaction
        const mdx = mouseRef.current.x - node.x;
        const mdy = mouseRef.current.y - node.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < 150) {
          const force = (150 - mdist) / 150;
          node.vx -= (mdx / mdist) * force * 0.5;
          node.vy -= (mdy / mdist) * force * 0.5;
          node.glow = Math.min(1, node.glow + force * 0.3);
        }

        // Apply friction
        node.vx *= 0.95;
        node.vy *= 0.95;

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Keep within bounds with soft boundaries
        const margin = 100;
        if (node.x < margin) node.vx += (margin - node.x) * 0.001;
        if (node.x > width - margin)
          node.vx -= (node.x - (width - margin)) * 0.001;
        if (node.y < margin) node.vy += (margin - node.y) * 0.001;
        if (node.y > height - margin)
          node.vy -= (node.y - (height - margin)) * 0.001;

        // Update trail
        node.trail.unshift({ x: node.x, y: node.y, opacity: 1 });
        if (node.trail.length > 15) {
          node.trail.pop();
        }
        node.trail.forEach((point, i) => {
          point.opacity = 1 - i / node.trail.length;
        });
      });
    };

    const drawConnections = (ctx: CanvasRenderingContext2D, time: number) => {
      nodesRef.current.forEach((node) => {
        node.connections.forEach((connId) => {
          const targetNode = nodesRef.current[connId];
          if (!targetNode) return;

          const dx = targetNode.x - node.x;
          const dy = targetNode.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Animated connection line
          const gradient = ctx.createLinearGradient(
            node.x,
            node.y,
            targetNode.x,
            targetNode.y
          );
          gradient.addColorStop(0, `${node.color}20`);
          gradient.addColorStop(0.5, `${node.color}40`);
          gradient.addColorStop(1, `${targetNode.color}20`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1 + Math.sin(time * 0.001 + node.id) * 0.5;
          ctx.globalAlpha = 0.3 + node.activity * 0.2;

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);

          // Curved line with animation
          const midX = (node.x + targetNode.x) / 2;
          const midY = (node.y + targetNode.y) / 2;
          const offsetX = (-dy / dist) * 30 * Math.sin(time * 0.001);
          const offsetY = (dx / dist) * 30 * Math.sin(time * 0.001);

          ctx.quadraticCurveTo(
            midX + offsetX,
            midY + offsetY,
            targetNode.x,
            targetNode.y
          );
          ctx.stroke();
        });
      });

      ctx.globalAlpha = 1;
    };

    const drawNodes = (ctx: CanvasRenderingContext2D, time: number) => {
      nodesRef.current.forEach((node) => {
        // Draw trail
        if (node.trail.length > 1) {
          ctx.beginPath();
          node.trail.forEach((point, i) => {
            if (i === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.strokeStyle = `${node.color}30`;
          ctx.lineWidth = node.radius * 0.3;
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Outer glow
        const glowRadius = node.radius * (1 + node.glow * 0.5);
        const glowGradient = ctx.createRadialGradient(
          node.x,
          node.y,
          node.radius * 0.5,
          node.x,
          node.y,
          glowRadius
        );
        glowGradient.addColorStop(0, `${node.color}60`);
        glowGradient.addColorStop(0.7, `${node.color}20`);
        glowGradient.addColorStop(1, `${node.color}00`);

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main node circle
        const nodeGradient = ctx.createRadialGradient(
          node.x - node.radius * 0.3,
          node.y - node.radius * 0.3,
          0,
          node.x,
          node.y,
          node.radius
        );
        nodeGradient.addColorStop(0, `${node.color}FF`);
        nodeGradient.addColorStop(1, `${node.color}CC`);

        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Node border
        ctx.strokeStyle = `${node.color}FF`;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8 + node.glow * 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Inner pulse
        const pulseRadius =
          node.radius * (0.6 + Math.sin(time * 0.003 + node.id) * 0.2);
        ctx.fillStyle = `${node.color}40`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Node label (only if not too small)
        if (node.radius > 15) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = 0.9;
          ctx.fillText(
            node.label.split(" ")[0],
            node.x,
            node.y - node.radius - 12
          );

          if (node.label.split(" ").length > 1) {
            ctx.fillText(
              node.label.split(" ").slice(1).join(" "),
              node.x,
              node.y - node.radius - 24
            );
          }
          ctx.globalAlpha = 1;
        }
      });
    };

    const createDataFlow = () => {
      if (nodesRef.current.length < 2) return;

      const fromIdx = Math.floor(Math.random() * nodesRef.current.length);
      let toIdx = Math.floor(Math.random() * nodesRef.current.length);
      while (toIdx === fromIdx) {
        toIdx = Math.floor(Math.random() * nodesRef.current.length);
      }

      flowsRef.current.push({
        id: Date.now(),
        fromNode: fromIdx,
        toNode: toIdx,
        progress: 0,
        speed: 0.002 + Math.random() * 0.003,
        particles: [],
      });
    };

    const updateDataFlows = (deltaTime: number) => {
      flowsRef.current = flowsRef.current.filter((flow) => {
        flow.progress += flow.speed;

        if (flow.progress >= 1) {
          // Create burst effect at destination
          const toNode = nodesRef.current[flow.toNode];
          if (toNode) {
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              particlesRef.current.push({
                id: Date.now() + i,
                x: toNode.x,
                y: toNode.y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 1,
                maxLife: 1,
                size: 2 + Math.random() * 2,
                color: toNode.color,
                opacity: 1,
              });
            }
          }
          return false; // Remove completed flow
        }

        // Update flow particles
        const fromNode = nodesRef.current[flow.fromNode];
        const toNode = nodesRef.current[flow.toNode];
        if (fromNode && toNode) {
          const x = fromNode.x + (toNode.x - fromNode.x) * flow.progress;
          const y = fromNode.y + (toNode.y - fromNode.y) * flow.progress;

          flow.particles.push({
            x,
            y,
            opacity: 1,
            size: 3 + Math.random() * 2,
          });

          if (flow.particles.length > 20) {
            flow.particles.shift();
          }

          // Fade older particles
          flow.particles.forEach((p, i) => {
            p.opacity = (i + 1) / flow.particles.length;
          });
        }

        return true;
      });
    };

    const drawDataFlows = (ctx: CanvasRenderingContext2D) => {
      flowsRef.current.forEach((flow) => {
        const fromNode = nodesRef.current[flow.fromNode];
        const toNode = nodesRef.current[flow.toNode];
        if (!fromNode || !toNode) return;

        flow.particles.forEach((particle) => {
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size
          );
          gradient.addColorStop(0, `${fromNode.color}FF`);
          gradient.addColorStop(0.5, `${toNode.color}AA`);
          gradient.addColorStop(1, `${toNode.color}00`);

          ctx.fillStyle = gradient;
          ctx.globalAlpha = particle.opacity * 0.8;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      ctx.globalAlpha = 1;
    };

    const updateParticles = (
      deltaTime: number,
      width: number,
      height: number
    ) => {
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life -= 0.01;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.opacity = particle.life;

        // Bounce off edges
        if (particle.x < 0 || particle.x > width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > height) particle.vy *= -0.8;

        return particle.life > 0;
      });
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
      particlesRef.current.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * 0.6;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    const drawLegend = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      const legendX = width - 220;
      const legendY = 20;

      // Legend background
      ctx.fillStyle = "#0B0E1180";
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(legendX, legendY, 200, 30 + sectors.length * 25);
      ctx.strokeRect(legendX, legendY, 200, 30 + sectors.length * 25);
      ctx.globalAlpha = 1;

      // Legend title
      ctx.fillStyle = "#FAFAFA";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Live Finance Overview", legendX + 10, legendY + 18);

      // Legend items
      sectors.forEach((sector, i) => {
        const itemY = legendY + 40 + i * 25;

        // Color indicator
        ctx.fillStyle = sector.color;
        ctx.beginPath();
        ctx.arc(legendX + 15, itemY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Sector name
        ctx.fillStyle = "#FAFAFA";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText(sector.name, legendX + 28, itemY + 4);
      });
    };

    const drawTitle = (ctx: CanvasRenderingContext2D, width: number) => {
      ctx.fillStyle = "#FAFAFA";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.7;
      ctx.fillText(
        "Real-time performance across finance sectors",
        width / 2,
        25
      );
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(
        "Global finance network activity • Live invoice finance visualization",
        width / 2,
        42
      );
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Visibility change handler
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isVisible]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden bg-[#0B0E11]">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          display: "block",
          background: "linear-gradient(135deg, #0B0E11 0%, #161A1E 100%)",
        }}
      />
    </div>
  );
};

export default LiveFinanceAnimation;

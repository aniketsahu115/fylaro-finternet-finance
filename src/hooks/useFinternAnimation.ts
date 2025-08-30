import { useEffect, useRef, useCallback } from "react";

interface FinternNode {
  id: string;
  name: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  sector: string;
  volume: number;
  apy: number;
  activity: number;
  pulsePhase: number;
  connections: string[];
  smartContracts: number;
  tokenVolume: number;
  defiAssets: number;
  isActive: boolean;
  lastActivity: number;
  regionIndex: number;
}

interface CrossBorderFlow {
  id: string;
  fromNode: string;
  toNode: string;
  progress: number;
  speed: number;
  intensity: number;
  type: string;
  volume: number;
  timestamp: number;
  blockchain: string;
}

interface SmartContractExecution {
  id: string;
  nodeId: string;
  type: string;
  status: "pending" | "executing" | "completed";
  progress: number;
  participants: string[];
  volume: number;
  timestamp: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
}

interface LiveMetrics {
  totalTransactions: number;
  totalVolume: number;
  activeContracts: number;
  crossBorderFlows: number;
  mostActiveRegion: string;
  avgTransactionTime: number;
  networkEfficiency: number;
}

interface UseFinternAnimationProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  nodesRef: React.MutableRefObject<FinternNode[]>;
  flowsRef: React.MutableRefObject<CrossBorderFlow[]>;
  contractsRef: React.MutableRefObject<SmartContractExecution[]>;
  isPlaying: boolean;
  animationSpeed: number;
  showDataLayer: boolean;
  showSmartContracts: boolean;
  selectedSector: string;
  selectedBlockchain: string;
  selectedRegion: string;
  onMetricsUpdate: (metrics: LiveMetrics) => void;
  onContractSelect: (contract: SmartContractExecution | null) => void;
}

export const useFinternAnimation = ({
  canvasRef,
  nodesRef,
  flowsRef,
  contractsRef,
  isPlaying,
  animationSpeed,
  showDataLayer,
  showSmartContracts,
  selectedSector,
  selectedBlockchain,
  selectedRegion,
  onMetricsUpdate,
  onContractSelect,
}: UseFinternAnimationProps) => {
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const worldMapPathRef = useRef<Path2D>();

  // Enhanced color scheme
  const colors = {
    background: "#0B0E11",
    mapOutline: "#1F2937",
    mapFill: "#111827",

    // Industry colors with gradients
    Healthcare: "#F59E0B",
    Manufacturing: "#3B82F6",
    Technology: "#10B981",
    Logistics: "#F97316",
    Finance: "#8B5CF6",
    Energy: "#EF4444",
    Agriculture: "#84CC16",
    Education: "#06B6D4",

    // Flow colors
    flows: {
      "trade-settlement": "#10B981",
      "data-request": "#3B82F6",
      "kyc-handshake": "#F59E0B",
      "token-transfer": "#8B5CF6",
      "smart-contract": "#EF4444",
      "cross-border-payment": "#06B6D4",
    },

    // Blockchain colors
    blockchains: {
      Ethereum: "#627EEA",
      BSC: "#F3BA2F",
      Polygon: "#8247E5",
      Solana: "#9945FF",
      Avalanche: "#E84142",
      Arbitrum: "#28A0F0",
    },

    particle: "#F59E0B",
    connection: "#374151",
    activeConnection: "#F59E0B",
    text: "#FAFAFA",
    textSecondary: "#9CA3AF",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",

    // Glow effects
    glow: {
      primary: "#F59E0B",
      secondary: "#10B981",
      warning: "#EF4444",
    },
  };

  // Helper functions
  const getSectorColor = (sector: string): string => {
    const sectorColors: Record<string, string> = {
      Healthcare: colors.Healthcare,
      Manufacturing: colors.Manufacturing,
      Technology: colors.Technology,
      Logistics: colors.Logistics,
      Finance: colors.Finance,
      Energy: colors.Energy,
      Agriculture: colors.Agriculture,
      Education: colors.Education,
    };
    return sectorColors[sector] || colors.Technology;
  };

  const getFlowColor = (type: string): string => {
    return (
      colors.flows[type as keyof typeof colors.flows] ||
      colors.flows["token-transfer"]
    );
  };

  const getBlockchainColor = (blockchain: string): string => {
    return (
      colors.blockchains[blockchain as keyof typeof colors.blockchains] ||
      colors.blockchains.Ethereum
    );
  };

  // Create particles for visual effects
  const createParticles = (
    x: number,
    y: number,
    count: number = 8,
    color: string = colors.particle
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 3 + 1;

      particlesRef.current.push({
        id: `particle-${Date.now()}-${i}`,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 4 + 2,
        opacity: 1,
        color,
      });
    }
  };

  // Draw world map outline
  const drawWorldMap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    if (!worldMapPathRef.current) {
      const path = new Path2D();

      // Simplified continent outlines with more realistic shapes
      const continents = [
        // North America
        {
          x: width * 0.12,
          y: height * 0.25,
          w: width * 0.28,
          h: height * 0.4,
          curves: true,
        },
        // South America
        {
          x: width * 0.25,
          y: height * 0.58,
          w: width * 0.15,
          h: height * 0.35,
          curves: true,
        },
        // Europe
        {
          x: width * 0.45,
          y: height * 0.22,
          w: width * 0.18,
          h: height * 0.25,
          curves: true,
        },
        // Africa
        {
          x: width * 0.48,
          y: height * 0.42,
          w: width * 0.15,
          h: height * 0.4,
          curves: true,
        },
        // Asia
        {
          x: width * 0.58,
          y: height * 0.18,
          w: width * 0.3,
          h: height * 0.45,
          curves: true,
        },
        // Australia
        {
          x: width * 0.75,
          y: height * 0.68,
          w: width * 0.15,
          h: height * 0.18,
          curves: true,
        },
      ];

      continents.forEach((continent) => {
        if (continent.curves) {
          // Create more organic shapes
          path.moveTo(continent.x, continent.y + continent.h * 0.3);
          path.bezierCurveTo(
            continent.x - continent.w * 0.1,
            continent.y,
            continent.x + continent.w * 0.7,
            continent.y - continent.h * 0.1,
            continent.x + continent.w,
            continent.y + continent.h * 0.2
          );
          path.bezierCurveTo(
            continent.x + continent.w * 1.1,
            continent.y + continent.h * 0.7,
            continent.x + continent.w * 0.8,
            continent.y + continent.h * 1.1,
            continent.x + continent.w * 0.2,
            continent.y + continent.h
          );
          path.bezierCurveTo(
            continent.x - continent.w * 0.05,
            continent.y + continent.h * 0.8,
            continent.x - continent.w * 0.1,
            continent.y + continent.h * 0.5,
            continent.x,
            continent.y + continent.h * 0.3
          );
          path.closePath();
        } else {
          path.rect(continent.x, continent.y, continent.w, continent.h);
        }
      });

      worldMapPathRef.current = path;
    }

    // Draw map with subtle fill and border
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = colors.mapFill;
    ctx.fill(worldMapPathRef.current);

    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = colors.mapOutline;
    ctx.lineWidth = 1;
    ctx.stroke(worldMapPathRef.current);

    ctx.globalAlpha = 1;
  };

  // Draw network connections
  const drawConnections = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      nodesRef.current.forEach((node) => {
        if (
          !node.isActive ||
          (selectedSector !== "all" && node.sector !== selectedSector)
        )
          return;

        node.connections.forEach((connectionId) => {
          const targetNode = nodesRef.current.find(
            (n) => n.id === connectionId
          );
          if (!targetNode || !targetNode.isActive) return;

          // Skip if region filter is active and nodes don't match
          if (selectedRegion !== "all") {
            const regions = [
              "North America",
              "Europe",
              "Asia Pacific",
              "Oceania",
              "Latin America",
              "Middle East & Africa",
            ];
            if (
              regions[node.regionIndex] !== selectedRegion &&
              regions[targetNode.regionIndex] !== selectedRegion
            ) {
              return;
            }
          }

          const hasActiveFlow = flowsRef.current.some(
            (flow) =>
              (flow.fromNode === node.id && flow.toNode === targetNode.id) ||
              (flow.fromNode === targetNode.id && flow.toNode === node.id)
          );

          ctx.strokeStyle = hasActiveFlow
            ? colors.activeConnection
            : colors.connection;
          ctx.lineWidth = hasActiveFlow ? 2 : 1;
          ctx.globalAlpha = hasActiveFlow ? 0.6 : 0.2;

          if (hasActiveFlow) {
            ctx.shadowColor = colors.activeConnection;
            ctx.shadowBlur = 5;
          }

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();

          ctx.shadowBlur = 0;
        });
      });
      ctx.globalAlpha = 1;
    },
    [selectedSector, selectedRegion]
  );

  // Draw cross-border flows
  const drawFlows = useCallback(
    (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      flowsRef.current = flowsRef.current.filter((flow) => {
        // Apply filters
        if (
          selectedBlockchain !== "all" &&
          flow.blockchain !== selectedBlockchain
        ) {
          return true; // Keep but don't draw
        }

        const fromNode = nodesRef.current.find((n) => n.id === flow.fromNode);
        const toNode = nodesRef.current.find((n) => n.id === flow.toNode);

        if (!fromNode || !toNode) return false;

        if (
          selectedSector !== "all" &&
          fromNode.sector !== selectedSector &&
          toNode.sector !== selectedSector
        ) {
          return true; // Keep but don't draw
        }

        // Update progress
        flow.progress += flow.speed * animationSpeed;

        if (flow.progress >= 1) {
          // Flow completed - create particles at destination
          createParticles(toNode.x, toNode.y, 6, getFlowColor(flow.type));

          // Update node activity
          toNode.lastActivity = Date.now();
          toNode.activity = Math.min(1, toNode.activity + 0.1);

          return false; // Remove completed flow
        }

        // Calculate current position
        const currentX = fromNode.x + (toNode.x - fromNode.x) * flow.progress;
        const currentY = fromNode.y + (toNode.y - fromNode.y) * flow.progress;

        if (showDataLayer) {
          // Draw connection line with gradient
          const gradient = ctx.createLinearGradient(
            fromNode.x,
            fromNode.y,
            toNode.x,
            toNode.y
          );
          gradient.addColorStop(0, `${getFlowColor(flow.type)}40`);
          gradient.addColorStop(0.5, `${getFlowColor(flow.type)}80`);
          gradient.addColorStop(1, `${getFlowColor(flow.type)}40`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 + flow.intensity;
          ctx.globalAlpha = 0.6 * flow.intensity;

          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();

          // Draw moving data packet with trail effect
          const flowColor = getFlowColor(flow.type);

          // Trail effect
          for (let i = 0; i < 5; i++) {
            const trailProgress = Math.max(0, flow.progress - i * 0.05);
            if (trailProgress <= 0) break;

            const trailX = fromNode.x + (toNode.x - fromNode.x) * trailProgress;
            const trailY = fromNode.y + (toNode.y - fromNode.y) * trailProgress;

            ctx.fillStyle = `${flowColor}${Math.round(
              (1 - i * 0.2) * 255 * flow.intensity
            )
              .toString(16)
              .padStart(2, "0")}`;
            ctx.shadowColor = flowColor;
            ctx.shadowBlur = 8 - i;

            ctx.beginPath();
            ctx.arc(trailX, trailY, 4 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Main packet
          ctx.fillStyle = flowColor;
          ctx.shadowColor = flowColor;
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        }

        return true;
      });

      ctx.globalAlpha = 1;
    },
    [
      selectedBlockchain,
      selectedSector,
      showDataLayer,
      animationSpeed,
      createParticles,
      getFlowColor,
    ]
  );

  // Draw smart contract executions
  const drawSmartContracts = useCallback(
    (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      if (!showSmartContracts) return;

      contractsRef.current = contractsRef.current.filter((contract) => {
        const node = nodesRef.current.find((n) => n.id === contract.nodeId);
        if (!node) return false;

        // Update contract progress
        if (contract.status === "pending") {
          contract.status = "executing";
          contract.progress = 0;
        } else if (contract.status === "executing") {
          contract.progress += (0.5 + Math.random() * 1) * animationSpeed;

          if (contract.progress >= 100) {
            contract.status = "completed";
            createParticles(node.x, node.y, 10, colors.success);

            // Execute contract completion effects on participant nodes
            contract.participants.forEach((participantId) => {
              const participantNode = nodesRef.current.find(
                (n) => n.id === participantId
              );
              if (participantNode) {
                createParticles(
                  participantNode.x,
                  participantNode.y,
                  5,
                  colors.success
                );
              }
            });
          }
        }

        if (
          contract.status === "completed" &&
          Date.now() - contract.timestamp > 5000
        ) {
          return false; // Remove old completed contracts
        }

        // Draw contract visualization
        const radius = 25 + Math.sin(Date.now() * 0.005) * 5;

        // Contract execution ring
        ctx.strokeStyle =
          contract.status === "executing"
            ? colors.warning
            : contract.status === "completed"
            ? colors.success
            : colors.textSecondary;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;

        if (contract.status === "executing") {
          ctx.shadowColor = colors.warning;
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          radius,
          0,
          (Math.PI * 2 * contract.progress) / 100
        );
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Draw participant connections
        if (contract.status === "executing") {
          contract.participants.forEach((participantId) => {
            const participantNode = nodesRef.current.find(
              (n) => n.id === participantId
            );
            if (participantNode && participantNode.id !== node.id) {
              ctx.strokeStyle = `${colors.warning}60`;
              ctx.lineWidth = 2;
              ctx.globalAlpha = 0.4;

              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(participantNode.x, participantNode.y);
              ctx.stroke();
            }
          });
        }

        return true;
      });

      ctx.globalAlpha = 1;
    },
    [showSmartContracts, animationSpeed, createParticles]
  );

  // Draw nodes
  const drawNodes = useCallback(
    (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      nodesRef.current.forEach((node) => {
        // Apply filters
        if (selectedSector !== "all" && node.sector !== selectedSector) return;

        if (selectedRegion !== "all") {
          const regions = [
            "North America",
            "Europe",
            "Asia Pacific",
            "Oceania",
            "Latin America",
            "Middle East & Africa",
          ];
          if (regions[node.regionIndex] !== selectedRegion) return;
        }

        // Update node animation
        node.pulsePhase += 0.03 * animationSpeed;

        // Decay activity over time
        if (Date.now() - node.lastActivity > 10000) {
          node.activity = Math.max(0.2, node.activity - 0.01);
        }

        // Random activity changes
        if (Math.random() < 0.005 * animationSpeed) {
          node.isActive = !node.isActive;
        }

        const baseRadius = 8 + node.activity * 4;
        const pulseRadius = baseRadius + Math.sin(node.pulsePhase) * 2;
        const sectorColor = getSectorColor(node.sector);

        // Outer glow ring
        if (node.isActive) {
          const glowGradient = ctx.createRadialGradient(
            node.x,
            node.y,
            0,
            node.x,
            node.y,
            pulseRadius + 15
          );
          glowGradient.addColorStop(0, `${sectorColor}60`);
          glowGradient.addColorStop(0.7, `${sectorColor}20`);
          glowGradient.addColorStop(1, "transparent");

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseRadius + 15, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main node circle
        ctx.fillStyle = node.isActive ? sectorColor : colors.connection;

        if (node.isActive) {
          ctx.shadowColor = sectorColor;
          ctx.shadowBlur = 12;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Inner core
        if (node.isActive) {
          const innerPulse = Math.sin(node.pulsePhase * 2) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${innerPulse * 0.9})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, baseRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Activity indicator ring
        if (node.activity > 0.7) {
          ctx.strokeStyle = `${sectorColor}80`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, baseRadius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Smart contract indicator
        if (
          contractsRef.current.some(
            (c) => c.nodeId === node.id && c.status === "executing"
          )
        ) {
          ctx.fillStyle = colors.warning;
          ctx.beginPath();
          ctx.arc(
            node.x + baseRadius - 2,
            node.y - baseRadius + 2,
            3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
    },
    [selectedSector, selectedRegion, getSectorColor, animationSpeed]
  );

  // Draw particles
  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      particlesRef.current = particlesRef.current.filter((particle) => {
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02 * animationSpeed;
        particle.opacity = particle.life;
        particle.vx *= 0.98; // Slight friction
        particle.vy *= 0.98;

        if (particle.life <= 0) return false;

        // Draw particle
        ctx.fillStyle = `${particle.color}${Math.round(particle.opacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.arc(
          particle.x,
          particle.y,
          particle.size * particle.life,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.shadowBlur = 0;

        return true;
      });
    },
    [animationSpeed]
  );

  // Main animation loop
  const animate = useCallback(
    (currentTime: number) => {
      if (!isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const canvas = canvasRef.current;
      if (!canvas?.parentElement) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;

      // Clear canvas with background
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      // Draw layers
      drawWorldMap(ctx, width, height);
      drawConnections(ctx);
      drawFlows(ctx, deltaTime);
      drawSmartContracts(ctx, deltaTime);
      drawNodes(ctx, deltaTime);
      drawParticles(ctx, deltaTime);

      // Update metrics periodically
      if (Math.floor(currentTime / 1000) % 2 === 0 && deltaTime > 0) {
        const activeNodes = nodesRef.current.filter((n) => n.isActive).length;
        const totalVolume = flowsRef.current.reduce(
          (sum, flow) => sum + flow.volume,
          0
        );
        const activeContracts = contractsRef.current.filter(
          (c) => c.status !== "completed"
        ).length;

        onMetricsUpdate({
          totalTransactions: flowsRef.current.length,
          totalVolume,
          activeContracts,
          crossBorderFlows: flowsRef.current.length,
          mostActiveRegion: "Asia Pacific", // Simplified
          avgTransactionTime: 2.3 + Math.random() * 0.7,
          networkEfficiency: 95 + Math.random() * 4,
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [
      isPlaying,
      drawWorldMap,
      drawConnections,
      drawFlows,
      drawSmartContracts,
      drawNodes,
      drawParticles,
      onMetricsUpdate,
    ]
  );

  // Initialize and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Setup canvas with high DPI support
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

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  return {
    createParticles,
    getSectorColor,
    getFlowColor,
    getBlockchainColor,
  };
};

export default useFinternAnimation;

import React, { useEffect, useRef, useState } from 'react';

interface GlobalNode {
  id: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  activity: number;
  pulsePhase: number;
  connections: number[];
  volume: string;
  apy: string;
  sector: string;
  isActive: boolean;
  lastPulse: number;
}

interface DataFlow {
  id: number;
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  intensity: number;
  type: 'data' | 'transaction' | 'validation';
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
  opacity: number;
}

const GlobalMapAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const nodesRef = useRef<GlobalNode[]>([]);
  const dataFlowsRef = useRef<DataFlow[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // Colors matching the market overview theme
  const colors = {
    background: '#0B0E11',
    mapOutline: '#2B3139',
    nodeDefault: '#404040',
    nodeHealthcare: '#F0B90B', // Yellow-gold
    nodeManufacturing: '#0052FF', // Blue
    nodeTechnology: '#00D4AA', // Green
    nodeLogistics: '#FF6B35', // Orange
    connectionIdle: '#2B3139',
    connectionActive: '#F0B90B',
    dataFlow: '#00D4AA',
    particle: '#F0B90B',
    text: '#FAFAFA',
    textSecondary: '#B7BDC6',
    glow: '#F0B90B'
  };

  // Major global financial/business centers
  const cityData = [
    { name: 'New York', lat: 40.7128, lng: -74.0060, sector: 'Healthcare', volume: '$45M', apy: '12.5%' },
    { name: 'London', lat: 51.5074, lng: -0.1278, sector: 'Manufacturing', volume: '$32M', apy: '10.8%' },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, sector: 'Technology', volume: '$28M', apy: '14.2%' },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, sector: 'Logistics', volume: '$22M', apy: '11.3%' },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, sector: 'Technology', volume: '$18M', apy: '13.1%' },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, sector: 'Manufacturing', volume: '$25M', apy: '9.7%' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, sector: 'Healthcare', volume: '$15M', apy: '11.8%' },
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333, sector: 'Logistics', volume: '$12M', apy: '10.4%' },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, sector: 'Technology', volume: '$20M', apy: '12.9%' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, sector: 'Healthcare', volume: '$16M', apy: '13.5%' },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832, sector: 'Manufacturing', volume: '$19M', apy: '10.2%' },
    { name: 'Zurich', lat: 47.3769, lng: 8.5417, sector: 'Technology', volume: '$14M', apy: '11.7%' }
  ];

  const getSectorColor = (sector: string): string => {
    switch (sector) {
      case 'Healthcare': return colors.nodeHealthcare;
      case 'Manufacturing': return colors.nodeManufacturing;
      case 'Technology': return colors.nodeTechnology;
      case 'Logistics': return colors.nodeLogistics;
      default: return colors.nodeDefault;
    }
  };

  const projectCoordinates = (lat: number, lng: number, width: number, height: number) => {
    // Simple equirectangular projection
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
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

    // Initialize nodes
    const initializeNodes = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      nodesRef.current = cityData.map((city, index) => {
        const { x, y } = projectCoordinates(city.lat, city.lng, width, height);
        return {
          id: index,
          x,
          y,
          lat: city.lat,
          lng: city.lng,
          activity: Math.random() * 0.5 + 0.5,
          pulsePhase: Math.random() * Math.PI * 2,
          connections: [], // Will be populated below
          volume: city.volume,
          apy: city.apy,
          sector: city.sector,
          isActive: Math.random() > 0.3,
          lastPulse: 0
        };
      });

      // Create connections between nearby nodes
      nodesRef.current.forEach((node, i) => {
        const connections: number[] = [];
        nodesRef.current.forEach((otherNode, j) => {
          if (i !== j) {
            const distance = Math.sqrt(
              Math.pow(node.x - otherNode.x, 2) + 
              Math.pow(node.y - otherNode.y, 2)
            );
            // Connect nodes within a certain distance
            if (distance < width * 0.4 && Math.random() > 0.6) {
              connections.push(j);
            }
          }
        });
        node.connections = connections.slice(0, 3); // Max 3 connections per node
      });

      // Initialize data flows
      dataFlowsRef.current = [];
      particlesRef.current = [];
    };

    initializeNodes();

    // Create data flow
    const createDataFlow = () => {
      const activeNodes = nodesRef.current.filter(node => node.isActive);
      if (activeNodes.length < 2) return;

      const fromNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      const possibleTargets = fromNode.connections
        .map(id => nodesRef.current[id])
        .filter(node => node.isActive);

      if (possibleTargets.length === 0) return;

      const toNode = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

      dataFlowsRef.current.push({
        id: Date.now() + Math.random(),
        fromNode: fromNode.id,
        toNode: toNode.id,
        progress: 0,
        speed: 0.005 + Math.random() * 0.01,
        intensity: 0.5 + Math.random() * 0.5,
        type: Math.random() > 0.5 ? 'data' : 'transaction'
      });
    };

    // Create particles
    const createParticles = (x: number, y: number, count: number = 5) => {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          id: Date.now() + Math.random(),
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          maxLife: 1,
          size: Math.random() * 3 + 1,
          opacity: 1
        });
      }
    };

    // Draw world map outline (simplified)
    const drawWorldMap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.strokeStyle = colors.mapOutline;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      // Draw simplified continent outlines
      const continents = [
        // North America
        { x: width * 0.15, y: height * 0.3, w: width * 0.25, h: height * 0.35 },
        // South America
        { x: width * 0.22, y: height * 0.6, w: width * 0.12, h: height * 0.3 },
        // Europe
        { x: width * 0.45, y: height * 0.25, w: width * 0.15, h: height * 0.2 },
        // Africa
        { x: width * 0.48, y: height * 0.45, w: width * 0.12, h: height * 0.35 },
        // Asia
        { x: width * 0.6, y: height * 0.2, w: width * 0.25, h: height * 0.4 },
        // Australia
        { x: width * 0.75, y: height * 0.65, w: width * 0.12, h: height * 0.15 }
      ];

      continents.forEach(continent => {
        ctx.strokeRect(continent.x, continent.y, continent.w, continent.h);
      });

      ctx.globalAlpha = 1;
    };

    // Animation loop
    const animate = (currentTime: number) => {
      if (!canvas.parentElement) return;
      
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;
      
      // Clear canvas
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      // Draw world map
      drawWorldMap(ctx, width, height);

      // Update and draw data flows
      dataFlowsRef.current = dataFlowsRef.current.filter(flow => {
        flow.progress += flow.speed;
        
        if (flow.progress >= 1) {
          // Flow reached destination, create particles
          const toNode = nodesRef.current[flow.toNode];
          createParticles(toNode.x, toNode.y);
          return false;
        }

        const fromNode = nodesRef.current[flow.fromNode];
        const toNode = nodesRef.current[flow.toNode];
        
        const currentX = fromNode.x + (toNode.x - fromNode.x) * flow.progress;
        const currentY = fromNode.y + (toNode.y - fromNode.y) * flow.progress;

        // Draw connection line
        ctx.strokeStyle = `rgba(0, 212, 170, ${0.3 * flow.intensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        // Draw moving data packet
        ctx.fillStyle = flow.type === 'data' ? colors.dataFlow : colors.particle;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        return true;
      });

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.opacity = particle.life;

        if (particle.life <= 0) return false;

        ctx.fillStyle = `rgba(240, 185, 11, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Update and draw nodes
      nodesRef.current.forEach(node => {
        node.pulsePhase += 0.05;
        
        // Random activity changes
        if (Math.random() < 0.01) {
          node.isActive = !node.isActive;
        }

        // Node base circle
        const baseRadius = 8;
        const pulseRadius = baseRadius + Math.sin(node.pulsePhase) * 3;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, pulseRadius + 10
        );
        gradient.addColorStop(0, `${getSectorColor(node.sector)}66`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius + 10, 0, Math.PI * 2);
        ctx.fill();

        // Main node
        ctx.fillStyle = node.isActive ? getSectorColor(node.sector) : colors.nodeDefault;
        ctx.shadowColor = node.isActive ? getSectorColor(node.sector) : 'transparent';
        ctx.shadowBlur = node.isActive ? 10 : 0;
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner pulse
        if (node.isActive) {
          const innerPulse = Math.sin(node.pulsePhase * 2) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${innerPulse * 0.8})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, baseRadius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Create new data flows periodically
      if (Math.random() < 0.02) {
        createDataFlow();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: colors.background }}
      />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="text-white font-medium mb-2">Live Market Overview</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.nodeHealthcare }}></div>
            <span className="text-gray-300">Healthcare</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.nodeManufacturing }}></div>
            <span className="text-gray-300">Manufacturing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.nodeTechnology }}></div>
            <span className="text-gray-300">Technology</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.nodeLogistics }}></div>
            <span className="text-gray-300">Logistics</span>
          </div>
        </div>
      </div>

      {/* Real-time stats overlay */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
        <div className="text-white font-medium text-sm mb-1">Real-time performance across industry sectors</div>
        <div className="text-gray-400 text-xs">
          Global network activity • Live data flow visualization
        </div>
      </div>
    </div>
  );
};

export default GlobalMapAnimation;

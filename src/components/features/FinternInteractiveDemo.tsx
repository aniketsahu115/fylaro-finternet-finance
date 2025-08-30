import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Force cache refresh - Fylaro Finance Demo v2.0
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  TrendingUp,
  Globe,
  Zap,
  Activity,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";

// Project-specific interfaces for Fylaro Finance
interface FinternNode {
  id: string;
  x: number;
  y: number;
  scaledX?: number;
  scaledY?: number;
  type:
    | "invoice_issuer"
    | "investor"
    | "marketplace"
    | "payment_gateway"
    | "bank"
    | "regulator";
  sector:
    | "trade_finance"
    | "supply_chain"
    | "working_capital"
    | "factoring"
    | "receivables"
    | "export_finance";
  region: string;
  isActive: boolean;
  activity: number;
  lastActivity: number;
  pulsePhase: number;
  invoiceVolume: number;
  creditScore: number;
}

interface TokenizedFlow {
  id: string;
  fromNode: string;
  toNode: string;
  type: "invoice_creation" | "investment" | "payment" | "settlement";
  amount: number;
  progress: number;
  speed: number;
  tokenId?: string;
  blockchain: string;
}

interface SmartContract {
  id: string;
  nodeId: string;
  type:
    | "invoice_tokenization"
    | "escrow"
    | "payment_automation"
    | "credit_scoring";
  status: "pending" | "executing" | "completed";
  progress: number;
  timestamp: number;
  invoiceId?: string;
}

interface FinternMetrics {
  totalInvoicesTokenized: number;
  totalValueLocked: number;
  activeInvestors: number;
  crossBorderTransactions: number;
  averageROI: number;
  networkEfficiency: number;
}

// Fylaro Finance color scheme
const fylaroColors = {
  background: "#0a0f1c",
  mapOutline: "#1e293b",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  invoice: "#06b6d4",
  payment: "#10b981",
  investment: "#8b5cf6",
  tokenization: "#f59e0b",
};

// Node type colors based on Fylaro project theme
const nodeTypeColors = {
  invoice_issuer: "#06b6d4", // Cyan for invoice issuers
  investor: "#10b981", // Green for investors
  marketplace: "#8b5cf6", // Purple for marketplace
  payment_gateway: "#3b82f6", // Blue for payment gateways
  bank: "#f59e0b", // Orange for banks
  regulator: "#ef4444", // Red for regulators
};

// Sector colors - Invoice Finance Specific
const sectorColors = {
  trade_finance: "#3b82f6", // Blue for trade finance
  supply_chain: "#10b981", // Green for supply chain finance
  working_capital: "#f59e0b", // Orange for working capital
  factoring: "#8b5cf6", // Purple for factoring
  receivables: "#06b6d4", // Cyan for receivables finance
  export_finance: "#ef4444", // Red for export finance
};

// Helper functions
const getNodeColor = (nodeType: string) =>
  nodeTypeColors[nodeType as keyof typeof nodeTypeColors] ||
  fylaroColors.primary;
const getSectorColor = (sector: string) =>
  sectorColors[sector as keyof typeof sectorColors] || fylaroColors.primary;

const getFlowColor = (type: string) => {
  switch (type) {
    case "invoice_creation":
      return fylaroColors.invoice;
    case "investment":
      return fylaroColors.investment;
    case "payment":
      return fylaroColors.payment;
    case "settlement":
      return fylaroColors.success;
    default:
      return fylaroColors.primary;
  }
};

const formatCurrency = (amount: number) => {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
};

// Enhanced icon drawing functions with geometric shapes that actually work
const drawNodeIcon = (
  ctx: CanvasRenderingContext2D,
  nodeType: string,
  x: number,
  y: number,
  size: number = 16
) => {
  ctx.save();

  // Set up drawing context with white background and black outline
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1.5;

  const halfSize = size / 2;

  switch (nodeType) {
    case "invoice_issuer":
      // Draw document with lines
      ctx.fillRect(x - halfSize + 2, y - halfSize, size - 4, size);
      ctx.strokeRect(x - halfSize + 2, y - halfSize, size - 4, size);

      // Add document lines
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const lineY = y - halfSize + 3 + i * 3;
        ctx.beginPath();
        ctx.moveTo(x - halfSize + 4, lineY);
        ctx.lineTo(x + halfSize - 4, lineY);
        ctx.stroke();
      }
      break;

    case "investor":
      // Draw wallet
      ctx.fillRect(x - halfSize, y - halfSize + 2, size, size - 4);
      ctx.strokeRect(x - halfSize, y - halfSize + 2, size, size - 4);

      // Add dollar sign
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.font = "bold 10px Arial";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText("$", x, y + 3);
      break;

    case "marketplace":
      // Draw shopping bag
      ctx.fillRect(x - halfSize + 1, y - halfSize + 3, size - 2, size - 6);
      ctx.strokeRect(x - halfSize + 1, y - halfSize + 3, size - 2, size - 6);

      // Add handles
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - 3, y - halfSize + 6, 2, 0, Math.PI, true);
      ctx.arc(x + 3, y - halfSize + 6, 2, 0, Math.PI, true);
      ctx.stroke();
      break;

    case "payment_gateway":
      // Draw credit card
      ctx.fillRect(x - halfSize, y - halfSize + 2, size, size - 4);
      ctx.strokeRect(x - halfSize, y - halfSize + 2, size, size - 4);

      // Add stripe
      ctx.fillStyle = "#333333";
      ctx.fillRect(x - halfSize + 1, y - 1, size - 2, 2);
      break;

    case "bank":
      // Draw building with columns
      ctx.strokeRect(x - halfSize, y - halfSize, size, size);

      // Add columns
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const colX = x - halfSize + 2 + i * 4;
        ctx.beginPath();
        ctx.moveTo(colX, y - halfSize + 2);
        ctx.lineTo(colX, y + halfSize - 2);
        ctx.stroke();
      }
      break;

    case "regulator":
      // Draw shield
      ctx.beginPath();
      ctx.moveTo(x, y - halfSize);
      ctx.lineTo(x + halfSize - 2, y - 2);
      ctx.lineTo(x + halfSize - 2, y + halfSize - 4);
      ctx.lineTo(x, y + halfSize);
      ctx.lineTo(x - halfSize + 2, y + halfSize - 4);
      ctx.lineTo(x - halfSize + 2, y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    default:
      // Default circle
      ctx.beginPath();
      ctx.arc(x, y, halfSize - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  }

  ctx.restore();
};

const drawFlowIcon = (
  ctx: CanvasRenderingContext2D,
  flowType: string,
  x: number,
  y: number,
  size: number = 12
) => {
  ctx.save();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;

  const halfSize = size / 2;

  switch (flowType) {
    case "invoice_creation":
      // Draw plus sign
      ctx.beginPath();
      ctx.moveTo(x, y - halfSize + 2);
      ctx.lineTo(x, y + halfSize - 2);
      ctx.moveTo(x - halfSize + 2, y);
      ctx.lineTo(x + halfSize - 2, y);
      ctx.stroke();
      break;

    case "investment":
      // Draw dollar sign
      ctx.font = "bold 10px Arial";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.fillText("$", x, y + 3);
      break;

    case "payment":
      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(x - halfSize + 2, y);
      ctx.lineTo(x + halfSize - 4, y);
      ctx.moveTo(x + halfSize - 7, y - 3);
      ctx.lineTo(x + halfSize - 1, y);
      ctx.lineTo(x + halfSize - 7, y + 3);
      ctx.stroke();
      break;

    case "settlement":
      // Draw checkmark
      ctx.beginPath();
      ctx.moveTo(x - halfSize + 2, y);
      ctx.lineTo(x - 1, y + halfSize - 3);
      ctx.lineTo(x + halfSize - 2, y - halfSize + 3);
      ctx.stroke();
      break;
  }

  ctx.restore();
};

const FinternInteractiveDemo: React.FC = () => {
  // Canvas and animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef(0);

  // Data refs
  const nodesRef = useRef<FinternNode[]>([]);
  const flowsRef = useRef<TokenizedFlow[]>([]);
  const contractsRef = useRef<SmartContract[]>([]);

  // Control states
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState([1]);
  const [selectedNodeType, setSelectedNodeType] = useState("all");
  const [selectedSector, setSelectedSector] = useState("all");
  const [showTokenizedFlows, setShowTokenizedFlows] = useState(true);
  const [showSmartContracts, setShowSmartContracts] = useState(true);
  const [selectedContract, setSelectedContract] =
    useState<SmartContract | null>(null);

  // Live metrics
  const [liveMetrics, setLiveMetrics] = useState<FinternMetrics>({
    totalInvoicesTokenized: 8547,
    totalValueLocked: 145892000,
    activeInvestors: 3247,
    crossBorderTransactions: 1892,
    averageROI: 12.8,
    networkEfficiency: 98.4,
  });

  // Initialize nodes with project-specific data
  const initializeNodes = useCallback(() => {
    const nodeTypes: FinternNode["type"][] = [
      "invoice_issuer",
      "investor",
      "marketplace",
      "payment_gateway",
      "bank",
      "regulator",
    ];
    const sectors: FinternNode["sector"][] = [
      "trade_finance",
      "supply_chain",
      "working_capital",
      "factoring",
      "receivables",
      "export_finance",
    ];
    const newNodes: FinternNode[] = [];

    // Regional distributions for invoice finance
    const regionalPositions = [
      { region: "North America", centerX: 0.25, centerY: 0.35, spread: 0.12 },
      { region: "Europe", centerX: 0.52, centerY: 0.25, spread: 0.08 },
      { region: "Asia Pacific", centerX: 0.75, centerY: 0.4, spread: 0.15 },
      { region: "Latin America", centerX: 0.28, centerY: 0.7, spread: 0.08 },
      { region: "Africa", centerX: 0.55, centerY: 0.65, spread: 0.06 },
      { region: "Middle East", centerX: 0.62, centerY: 0.45, spread: 0.05 },
    ];

    for (let i = 0; i < 42; i++) {
      const regionIndex = i % regionalPositions.length;
      const region = regionalPositions[regionIndex];

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * region.spread;

      const x = region.centerX + Math.cos(angle) * distance;
      const y = region.centerY + Math.sin(angle) * distance;

      newNodes.push({
        id: `node-${i}`,
        x: x * 1000,
        y: y * 600,
        type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
        sector: sectors[Math.floor(Math.random() * sectors.length)],
        region: region.region,
        isActive: Math.random() > 0.15,
        activity: 0.3 + Math.random() * 0.7,
        lastActivity: Date.now() - Math.random() * 10000,
        pulsePhase: Math.random() * Math.PI * 2,
        invoiceVolume: 50000 + Math.random() * 500000,
        creditScore: 600 + Math.random() * 250,
      });
    }

    nodesRef.current = newNodes;
  }, []);

  // Create tokenized flows
  const createTokenizedFlow = useCallback(() => {
    const activeNodes = nodesRef.current.filter((n) => n.isActive);
    if (activeNodes.length < 2) return;

    const fromNode =
      activeNodes[Math.floor(Math.random() * activeNodes.length)];
    const toNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];

    if (fromNode.id === toNode.id) return;

    const flowTypes: TokenizedFlow["type"][] = [
      "invoice_creation",
      "investment",
      "payment",
      "settlement",
    ];
    const blockchains = ["Ethereum", "Polygon", "BSC", "Arbitrum"];

    const flow: TokenizedFlow = {
      id: `flow-${Date.now()}-${Math.random()}`,
      fromNode: fromNode.id,
      toNode: toNode.id,
      type: flowTypes[Math.floor(Math.random() * flowTypes.length)],
      amount: 5000 + Math.random() * 95000,
      progress: 0,
      speed: 0.003 + Math.random() * 0.007,
      tokenId: `TKN-${Math.floor(Math.random() * 999999)}`,
      blockchain: blockchains[Math.floor(Math.random() * blockchains.length)],
    };

    flowsRef.current.push(flow);

    // Create smart contract with 40% probability
    if (Math.random() < 0.4) {
      const contractTypes: SmartContract["type"][] = [
        "invoice_tokenization",
        "escrow",
        "payment_automation",
        "credit_scoring",
      ];
      const contract: SmartContract = {
        id: `contract-${Date.now()}-${Math.random()}`,
        nodeId: fromNode.id,
        type: contractTypes[Math.floor(Math.random() * contractTypes.length)],
        status: "pending",
        progress: 0,
        timestamp: Date.now(),
        invoiceId: `INV-${Math.floor(Math.random() * 999999)}`,
      };
      contractsRef.current.push(contract);
    }
  }, []);

  // Canvas click handler
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check for contract clicks
      contractsRef.current.forEach((contract) => {
        const node = nodesRef.current.find((n) => n.id === contract.nodeId);
        if (node && node.scaledX && node.scaledY) {
          const distance = Math.sqrt(
            (x - node.scaledX) ** 2 + (y - node.scaledY) ** 2
          );
          if (distance < 35) {
            setSelectedContract(contract);
          }
        }
      });
    },
    []
  );

  // Main animation loop
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
    initializeNodes();

    const animate = (currentTime: number) => {
      if (!isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const container = canvas.parentElement;
      if (!container) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Clear canvas with Fylaro background
      ctx.fillStyle = fylaroColors.background;
      ctx.fillRect(0, 0, width, height);

      // Draw world map regions
      ctx.strokeStyle = fylaroColors.mapOutline;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;

      const regions = [
        {
          x: width * 0.2,
          y: height * 0.3,
          w: width * 0.18,
          h: height * 0.25,
          name: "Americas",
        },
        {
          x: width * 0.45,
          y: height * 0.2,
          w: width * 0.15,
          h: height * 0.2,
          name: "Europe",
        },
        {
          x: width * 0.7,
          y: height * 0.25,
          w: width * 0.25,
          h: height * 0.35,
          name: "APAC",
        },
        {
          x: width * 0.25,
          y: height * 0.65,
          w: width * 0.12,
          h: height * 0.2,
          name: "LATAM",
        },
        {
          x: width * 0.5,
          y: height * 0.6,
          w: width * 0.1,
          h: height * 0.25,
          name: "Africa",
        },
        {
          x: width * 0.62,
          y: height * 0.45,
          w: width * 0.08,
          h: height * 0.15,
          name: "ME",
        },
      ];

      regions.forEach((region) => {
        ctx.beginPath();
        ctx.roundRect(region.x, region.y, region.w, region.h, 8);
        ctx.stroke();

        ctx.fillStyle = `${fylaroColors.mapOutline}15`;
        ctx.fill();

        // Add region labels
        ctx.fillStyle = fylaroColors.mapOutline;
        ctx.font = "12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          region.name,
          region.x + region.w / 2,
          region.y + region.h / 2
        );
      });
      ctx.globalAlpha = 1;

      // Update and draw flows
      if (showTokenizedFlows) {
        flowsRef.current = flowsRef.current.filter((flow) => {
          flow.progress += flow.speed * animationSpeed[0];

          if (flow.progress >= 1) {
            const toNode = nodesRef.current.find((n) => n.id === flow.toNode);
            if (toNode) {
              toNode.lastActivity = Date.now();
              toNode.activity = Math.min(1, toNode.activity + 0.15);
            }
            return false;
          }

          const fromNode = nodesRef.current.find((n) => n.id === flow.fromNode);
          const toNode = nodesRef.current.find((n) => n.id === flow.toNode);

          if (!fromNode || !toNode) return false;

          const fromX = (fromNode.x / 1000) * width;
          const fromY = (fromNode.y / 600) * height;
          const toX = (toNode.x / 1000) * width;
          const toY = (toNode.y / 600) * height;

          // Draw flow line
          const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
          gradient.addColorStop(0, `${getFlowColor(flow.type)}60`);
          gradient.addColorStop(1, `${getFlowColor(flow.type)}20`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;

          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();

          // Draw moving token
          const currentX = fromX + (toX - fromX) * flow.progress;
          const currentY = fromY + (toY - fromY) * flow.progress;

          // Token glow
          ctx.shadowColor = getFlowColor(flow.type);
          ctx.shadowBlur = 15;
          ctx.fillStyle = getFlowColor(flow.type);
          ctx.beginPath();
          ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;

          // Token background
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
          ctx.fill();

          // Draw flow icon
          drawFlowIcon(ctx, flow.type, currentX, currentY, 12);

          // Add labels
          if (flow.progress > 0.2 && flow.progress < 0.8) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(formatCurrency(flow.amount), currentX, currentY - 20);
            ctx.fillText(flow.blockchain, currentX, currentY + 25);
          }

          ctx.globalAlpha = 1;
          return true;
        });
      }

      // Update and draw smart contracts
      if (showSmartContracts) {
        contractsRef.current = contractsRef.current.filter((contract) => {
          const node = nodesRef.current.find((n) => n.id === contract.nodeId);
          if (!node) return false;

          if (contract.status === "pending") {
            contract.status = "executing";
            contract.progress = 0;
          } else if (contract.status === "executing") {
            contract.progress +=
              (0.8 + Math.random() * 1.2) * animationSpeed[0];

            if (contract.progress >= 100) {
              contract.status = "completed";
            }
          }

          if (
            contract.status === "completed" &&
            Date.now() - contract.timestamp > 6000
          ) {
            if (selectedContract?.id === contract.id) {
              setSelectedContract(null);
            }
            return false;
          }

          const scaledX = (node.x / 1000) * width;
          const scaledY = (node.y / 600) * height;

          // Draw contract ring
          const radius = 30;
          const ringColor =
            contract.status === "executing"
              ? fylaroColors.warning
              : contract.status === "completed"
              ? fylaroColors.success
              : fylaroColors.primary;

          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.9;

          ctx.beginPath();
          ctx.arc(
            scaledX,
            scaledY,
            radius,
            0,
            (Math.PI * 2 * contract.progress) / 100
          );
          ctx.stroke();

          // Contract label
          if (contract.status === "executing") {
            ctx.fillStyle = "#ffffff";
            ctx.font = "8px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(
              contract.type.replace("_", " "),
              scaledX,
              scaledY + radius + 12
            );
          }

          ctx.globalAlpha = 1;
          return true;
        });
      }

      // Update and draw nodes
      nodesRef.current.forEach((node) => {
        if (selectedNodeType !== "all" && node.type !== selectedNodeType)
          return;
        if (selectedSector !== "all" && node.sector !== selectedSector) return;

        const scaledX = (node.x / 1000) * width;
        const scaledY = (node.y / 600) * height;

        node.pulsePhase += 0.04 * animationSpeed[0];

        if (Date.now() - node.lastActivity > 15000) {
          node.activity = Math.max(0.3, node.activity - 0.008);
        }

        if (Math.random() < 0.003 * animationSpeed[0]) {
          node.isActive = !node.isActive;
        }

        const baseRadius = 12 + node.activity * 6;
        const pulseRadius = baseRadius + Math.sin(node.pulsePhase) * 3;
        const nodeColor = getNodeColor(node.type);
        const sectorColor = getSectorColor(node.sector);

        // Outer glow
        if (node.isActive) {
          const gradient = ctx.createRadialGradient(
            scaledX,
            scaledY,
            0,
            scaledX,
            scaledY,
            pulseRadius + 20
          );
          gradient.addColorStop(0, `${nodeColor}80`);
          gradient.addColorStop(0.5, `${sectorColor}40`);
          gradient.addColorStop(1, "transparent");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, pulseRadius + 20, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main node
        const nodeGradient = ctx.createRadialGradient(
          scaledX,
          scaledY,
          0,
          scaledX,
          scaledY,
          baseRadius
        );
        nodeGradient.addColorStop(0, nodeColor);
        nodeGradient.addColorStop(1, `${nodeColor}CC`);

        ctx.fillStyle = nodeGradient;

        if (node.isActive) {
          ctx.shadowColor = nodeColor;
          ctx.shadowBlur = 15;
        }

        ctx.beginPath();
        ctx.arc(scaledX, scaledY, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Inner core
        if (node.isActive) {
          const innerPulse = Math.sin(node.pulsePhase * 1.5) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255, 255, 255, ${innerPulse})`;
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, baseRadius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw node icon
        drawNodeIcon(ctx, node.type, scaledX, scaledY, baseRadius * 1.2);

        // Store scaled positions
        node.scaledX = scaledX;
        node.scaledY = scaledY;
      });

      // Create new flows periodically
      if (Math.random() < 0.06 * animationSpeed[0]) {
        createTokenizedFlow();
      }

      // Update metrics
      if (Math.floor(currentTime / 2000) % 3 === 0) {
        const totalValue = flowsRef.current.reduce(
          (sum, flow) => sum + flow.amount,
          0
        );

        setLiveMetrics((prev) => ({
          ...prev,
          totalInvoicesTokenized:
            prev.totalInvoicesTokenized +
            flowsRef.current.filter((f) => f.type === "invoice_creation")
              .length,
          totalValueLocked: Math.max(
            prev.totalValueLocked,
            prev.totalValueLocked + totalValue * 0.1
          ),
          crossBorderTransactions: flowsRef.current.length,
          averageROI: 12.8 + Math.random() * 2.4 - 1.2,
          networkEfficiency: 96 + Math.random() * 4,
        }));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isPlaying,
    animationSpeed,
    selectedNodeType,
    selectedSector,
    showTokenizedFlows,
    showSmartContracts,
    initializeNodes,
    createTokenizedFlow,
    selectedContract,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls Panel */}
        <Card className="lg:w-80 flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Fylaro Finance Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Playback Controls */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Animation Control</Label>
              <div className="flex gap-2">
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex-1"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-1" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    initializeNodes();
                    flowsRef.current = [];
                    contractsRef.current = [];
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Speed: {animationSpeed[0]}x</Label>
                <Slider
                  value={animationSpeed}
                  onValueChange={setAnimationSpeed}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Node Type Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Node Type Filter</Label>
              <Select
                value={selectedNodeType}
                onValueChange={setSelectedNodeType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Participants</SelectItem>
                  <SelectItem value="invoice_issuer">
                    Invoice Issuers
                  </SelectItem>
                  <SelectItem value="investor">Investors</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="payment_gateway">
                    Payment Gateways
                  </SelectItem>
                  <SelectItem value="bank">Banks</SelectItem>
                  <SelectItem value="regulator">Regulators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Finance Type Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Finance Type</Label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Finance Types</SelectItem>
                  <SelectItem value="trade_finance">Trade Finance</SelectItem>
                  <SelectItem value="supply_chain">
                    Supply Chain Finance
                  </SelectItem>
                  <SelectItem value="working_capital">
                    Working Capital
                  </SelectItem>
                  <SelectItem value="factoring">Invoice Factoring</SelectItem>
                  <SelectItem value="receivables">
                    Receivables Finance
                  </SelectItem>
                  <SelectItem value="export_finance">Export Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Layer Controls */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                Visualization Layers
              </Label>

              <div className="flex items-center justify-between">
                <Label htmlFor="tokenized-flows" className="text-xs">
                  Tokenized Flows
                </Label>
                <Switch
                  id="tokenized-flows"
                  checked={showTokenizedFlows}
                  onCheckedChange={setShowTokenizedFlows}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="smart-contracts" className="text-xs">
                  Smart Contracts
                </Label>
                <Switch
                  id="smart-contracts"
                  checked={showSmartContracts}
                  onCheckedChange={setShowSmartContracts}
                />
              </div>
            </div>

            <Separator />

            {/* Legends */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Finance Ecosystem</Label>
              <div className="space-y-2 text-xs">
                {Object.entries(nodeTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize text-muted-foreground">
                      {type.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Finance Types Legend */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Finance Types</Label>
              <div className="space-y-2 text-xs">
                {Object.entries(sectorColors).map(([sector, color]) => (
                  <div key={sector} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize text-muted-foreground">
                      {sector.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualization Panel */}
        <div className="flex-1 space-y-6">
          {/* Live Finance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Finance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-muted-foreground">
                    Trade Finance
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-muted-foreground">
                    Supply Chain Finance
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-muted-foreground">
                    Working Capital
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-muted-foreground">
                    Invoice Factoring
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm text-muted-foreground">
                    Receivables Finance
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-muted-foreground">
                    Export Finance
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Invoices Tokenized
                    </p>
                    <p className="text-2xl font-bold">
                      {liveMetrics.totalInvoicesTokenized.toLocaleString()}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-cyan-500" />
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+18.2%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Value Locked
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(liveMetrics.totalValueLocked)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+24.8%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Active Investors
                    </p>
                    <p className="text-2xl font-bold">
                      {liveMetrics.activeInvestors.toLocaleString()}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+12.4%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Cross-Border Txns
                    </p>
                    <p className="text-2xl font-bold">
                      {liveMetrics.crossBorderTransactions}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+31.7%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Average ROI</p>
                    <p className="text-2xl font-bold">
                      {liveMetrics.averageROI.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+2.3%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Network Efficiency
                    </p>
                    <p className="text-2xl font-bold">
                      {liveMetrics.networkEfficiency.toFixed(1)}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center mt-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">+1.8%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Fylaro Finance - Live Invoice Tokenization Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[700px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden border">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full cursor-crosshair"
                  onClick={handleCanvasClick}
                />

                {/* Contract Details Overlay */}
                {selectedContract && (
                  <div className="absolute top-4 right-4 bg-card border rounded-lg p-4 shadow-lg z-10 max-w-xs">
                    <div className="text-sm font-medium mb-2">
                      {selectedContract.type.replace("_", " ")}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Contract ID: {selectedContract.id.slice(-8)}
                    </div>
                    {selectedContract.invoiceId && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Invoice: {selectedContract.invoiceId}
                      </div>
                    )}
                    <div className="text-xs mb-3">
                      Status:{" "}
                      <span
                        className={`font-medium ${
                          selectedContract.status === "completed"
                            ? "text-green-400"
                            : selectedContract.status === "executing"
                            ? "text-yellow-400"
                            : "text-blue-400"
                        }`}
                      >
                        {selectedContract.status}
                      </span>
                    </div>
                    {selectedContract.status === "executing" && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Progress: {selectedContract.progress.toFixed(1)}%
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedContract.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => setSelectedContract(null)}
                    >
                      Close
                    </Button>
                  </div>
                )}

                {/* Live Stats Overlay */}
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 text-xs space-y-1">
                  <div className="font-medium text-primary">
                    Live Network Activity
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Active Flows:</span>
                    <span className="text-cyan-400">
                      {flowsRef.current?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Smart Contracts:
                    </span>
                    <span className="text-yellow-400">
                      {contractsRef.current?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Active Nodes:</span>
                    <span className="text-green-400">
                      {nodesRef.current?.filter((n) => n.isActive).length || 0}
                    </span>
                  </div>
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 text-xs">
                  <div className="font-medium mb-2">
                    Fylaro Invoice Finance Platform
                  </div>
                  <div className="text-muted-foreground space-y-1">
                    <div>• Nodes represent finance ecosystem participants</div>
                    <div>• Flowing tokens show invoice tokenization</div>
                    <div>• Rings indicate smart contract execution</div>
                    <div>• Colors represent different finance types</div>
                  </div>
                </div>

                {/* Blockchain Badge */}
                <div className="absolute bottom-4 right-4 bg-primary/20 border border-primary/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-primary font-medium">
                      Multi-Chain Enabled
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinternInteractiveDemo;

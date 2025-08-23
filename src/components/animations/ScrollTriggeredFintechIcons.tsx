import React, { useEffect, useRef, useState } from 'react';
import { 
  Wallet, 
  FileText, 
  Coins, 
  Shield, 
  CreditCard, 
  TrendingUp, 
  Zap, 
  Globe,
  Lock,
  DollarSign,
  PieChart,
  Smartphone
} from 'lucide-react';

interface FintechIcon {
  id: number;
  Icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  delay: number;
}

const ScrollTriggeredFintechIcons: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleIcons, setVisibleIcons] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);

  const fintechIcons: FintechIcon[] = [
    {
      id: 1,
      Icon: Wallet,
      title: "Digital Wallet",
      description: "Secure multi-currency wallet with instant transactions",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20 border-blue-500/30",
      delay: 0
    },
    {
      id: 2,
      Icon: FileText,
      title: "Smart Contracts",
      description: "Automated execution with zero-trust verification",
      color: "text-green-400",
      bgColor: "bg-green-500/20 border-green-500/30",
      delay: 200
    },
    {
      id: 3,
      Icon: Coins,
      title: "Token Staking",
      description: "Earn rewards through liquidity provision",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20 border-yellow-500/30",
      delay: 400
    },
    {
      id: 4,
      Icon: Shield,
      title: "Security Layer",
      description: "Military-grade encryption and fraud protection",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20 border-purple-500/30",
      delay: 600
    },
    {
      id: 5,
      Icon: CreditCard,
      title: "Payment Gateway",
      description: "Seamless integration with global payment systems",
      color: "text-pink-400",
      bgColor: "bg-pink-500/20 border-pink-500/30",
      delay: 800
    },
    {
      id: 6,
      Icon: TrendingUp,
      title: "Yield Optimization",
      description: "AI-powered portfolio management and returns",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20 border-emerald-500/30",
      delay: 1000
    },
    {
      id: 7,
      Icon: Zap,
      title: "Lightning Speed",
      description: "Sub-second transaction processing",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20 border-orange-500/30",
      delay: 1200
    },
    {
      id: 8,
      Icon: Globe,
      title: "Global Network",
      description: "Cross-border liquidity and accessibility",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20 border-cyan-500/30",
      delay: 1400
    },
    {
      id: 9,
      Icon: Lock,
      title: "Privacy First",
      description: "Zero-knowledge proofs and data protection",
      color: "text-red-400",
      bgColor: "bg-red-500/20 border-red-500/30",
      delay: 1600
    },
    {
      id: 10,
      Icon: DollarSign,
      title: "Fiat Bridge",
      description: "Seamless conversion between crypto and fiat",
      color: "text-teal-400",
      bgColor: "bg-teal-500/20 border-teal-500/30",
      delay: 1800
    },
    {
      id: 11,
      Icon: PieChart,
      title: "Analytics Suite",
      description: "Real-time insights and performance tracking",
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/20 border-indigo-500/30",
      delay: 2000
    },
    {
      id: 12,
      Icon: Smartphone,
      title: "Mobile First",
      description: "Native mobile experience and push notifications",
      color: "text-rose-400",
      bgColor: "bg-rose-500/20 border-rose-500/30",
      delay: 2200
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            // Trigger animations with staggered delays
            fintechIcons.forEach((icon) => {
              setTimeout(() => {
                setVisibleIcons(prev => new Set([...prev, icon.id]));
              }, icon.delay);
            });
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the component is visible
        rootMargin: '0px 0px -50px 0px' // Trigger 50px before entering viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasAnimated, fintechIcons]);

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background/95 to-secondary/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      <div ref={containerRef} className="relative z-10 container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 rounded-full px-6 py-2 mb-6 backdrop-blur-sm animate-fade-in-up">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Advanced Fintech Features</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent animate-fade-in-up animate-delay-100">
            Cutting-Edge Financial Technology
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animate-delay-200">
            Experience the future of finance with our comprehensive suite of integrated 
            fintech solutions designed for the modern digital economy.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {fintechIcons.map((iconData) => {
            const isVisible = visibleIcons.has(iconData.id);
            const { Icon } = iconData;
            
            return (
              <div
                key={iconData.id}
                className={`
                  group relative p-6 rounded-2xl border backdrop-blur-lg
                  transition-all duration-700 ease-out cursor-pointer
                  hover:scale-105 hover:shadow-2xl hover:shadow-primary/10
                  hover:border-primary/50 hover:bg-primary/5
                  ${iconData.bgColor}
                  ${isVisible 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95'
                  }
                `}
                style={{
                  transitionDelay: isVisible ? '0ms' : `${iconData.delay}ms`
                }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Icon container with floating animation */}
                <div className="relative flex flex-col items-center text-center space-y-4">
                  <div className={`
                    p-4 rounded-xl border transition-all duration-500
                    group-hover:scale-110 group-hover:rotate-3
                    ${iconData.bgColor} ${iconData.color}
                    ${isVisible ? 'animate-float' : ''}
                  `}>
                    <Icon className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className={`
                      font-bold text-lg transition-colors duration-300
                      ${iconData.color} group-hover:text-white
                    `}>
                      {iconData.title}
                    </h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                      {iconData.description}
                    </p>
                  </div>
                </div>

                {/* Subtle pulse animation */}
                <div className={`
                  absolute inset-0 rounded-2xl border-2 opacity-0
                  ${iconData.color.replace('text-', 'border-')}
                  ${isVisible ? 'animate-pulse-slow' : ''}
                  group-hover:opacity-30
                `}></div>
              </div>
            );
          })}
        </div>

        {/* Bottom accent */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Powered by next-generation blockchain infrastructure</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollTriggeredFintechIcons;

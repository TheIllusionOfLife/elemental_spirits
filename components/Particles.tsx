import React, { useEffect, useRef } from 'react';
import { Particle } from '../types';

interface ParticleSystemProps {
  particles: Particle[];
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ particles }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Use 'screen' or 'lighter' for glowing effect, but 'source-over' with opacity for solid core
    ctx.globalCompositeOperation = 'screen';

    particles.forEach(p => {
      ctx.beginPath();
      // Add gravity skew
      ctx.ellipse(p.x, p.y, p.size, p.size * (1 + Math.abs(p.vy)*0.1), 0, 0, Math.PI * 2);
      
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = gradient;
      ctx.fill();
    });

  }, [particles]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-20 w-full h-full"
    />
  );
};

export default ParticleSystem;
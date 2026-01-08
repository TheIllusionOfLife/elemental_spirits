import React from 'react';
import { ElementType } from '../types';

interface OrbVisualProps {
  type: ElementType;
  selected: boolean;
  isFever?: boolean;
}

const Face: React.FC<{ 
  selected: boolean; 
  isFever?: boolean; 
  type?: ElementType; // To customize face per type if needed
}> = ({ selected, isFever, type }) => {
  // Eye Logic
  const blinkClass = isFever || selected ? "" : "animate-blink";
  const eyeBase = "absolute w-[18%] h-[18%] bg-white rounded-full flex items-center justify-center overflow-hidden";
  const leftEyePos = "top-[35%] left-[25%]";
  const rightEyePos = "top-[35%] right-[25%]";
  const pupilBase = "w-[60%] h-[60%] bg-black rounded-full transition-transform duration-200";

  // Mouth Logic
  const mouthBase = "absolute left-[50%] translate-x-[-50%] transition-all duration-200";

  // Emotions
  if (isFever) {
    // CUTE Happy Fever Face
    // Arched Eyes (^ ^) and Open Mouth with Tongue
    return (
      <div className="absolute inset-0">
        {/* Left Eye (Arc) */}
        <div className="absolute top-[38%] left-[25%] w-[20%] h-[15%] border-t-[3px] border-l-[3px] border-white rounded-tl-full rotate-[45deg]"></div>
        {/* Right Eye (Arc) */}
        <div className="absolute top-[38%] right-[25%] w-[20%] h-[15%] border-t-[3px] border-r-[3px] border-white rounded-tr-full -rotate-[45deg]"></div>
        
        {/* Cheeks (Blush) */}
        <div className="absolute top-[52%] left-[15%] w-[15%] h-[10%] bg-pink-500/50 rounded-full blur-[1px]"></div>
        <div className="absolute top-[52%] right-[15%] w-[15%] h-[10%] bg-pink-500/50 rounded-full blur-[1px]"></div>

        {/* Mouth with Tongue */}
        <div className={`${mouthBase} bottom-[20%] w-[22%] h-[18%] bg-red-900 rounded-b-full overflow-hidden border-t-2 border-red-800`}>
             <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-pink-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (selected) {
    // Excited Eyes (Big, Sparkly)
    return (
      <div className="absolute inset-0">
        <div className={`${eyeBase} ${leftEyePos} h-[22%] w-[22%]`}>
            <div className={`${pupilBase} scale-110`}></div>
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        <div className={`${eyeBase} ${rightEyePos} h-[22%] w-[22%]`}>
            <div className={`${pupilBase} scale-110`}></div>
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        {/* Open Mouth */}
        <div className={`${mouthBase} bottom-[25%] w-[15%] h-[15%] bg-black/40 rounded-full animate-bounce`}></div>
      </div>
    );
  }

  // Normal Face
  return (
    <div className="absolute inset-0">
      <div className={`${eyeBase} ${leftEyePos} ${blinkClass} shadow-sm`}>
          <div className={`${pupilBase}`}></div>
      </div>
      <div className={`${eyeBase} ${rightEyePos} ${blinkClass} shadow-sm`}>
          <div className={`${pupilBase}`}></div>
      </div>
      {/* Tiny smile */}
      <div className={`${mouthBase} bottom-[35%] w-[10%] h-[5%] border-b-2 border-black/30 rounded-full opacity-60`}></div>
    </div>
  );
};

const OrbVisual: React.FC<OrbVisualProps> = ({ type, selected, isFever }) => {
  // Base Movement Logic
  // Idle: Float gently (creature-bounce)
  // Fever: Dance aggressively (creature-dance)
  // Selected: Squash a bit (squash)
  
  const moveClass = isFever 
    ? 'animate-creature-dance' 
    : selected 
        ? 'scale-110' // Selected logic handled by parent jelly, but we add scale here
        : 'animate-creature-bounce';
  
  // Wrapper for the creature body to separate it from the outer container transforms
  const bodyWrapper = `relative w-full h-full transition-all duration-300 ${moveClass}`;

  switch (type) {
    case ElementType.FIRE:
      // Ignis: Red, spiky/fuzzy top
      return (
        <div className={bodyWrapper}>
           {/* Glow */}
           <div className={`absolute inset-0 rounded-full bg-orange-500 blur-md opacity-40 transition-opacity ${selected ? 'opacity-80' : ''}`}></div>
           
           {/* Body */}
           <div className="absolute inset-1 bg-gradient-to-b from-red-500 to-orange-600 rounded-[50%_50%_40%_40%] shadow-inner overflow-hidden">
               {/* Shine */}
               <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-white/20 blur-sm rounded-full"></div>
           </div>
           
           {/* Hair/Spikes */}
           <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rotate-45 animate-pulse"></div>
           <div className="absolute top-0 left-1/4 w-3 h-3 bg-red-500 -rotate-12"></div>
           <div className="absolute top-0 right-1/4 w-3 h-3 bg-red-500 rotate-12"></div>

           <Face selected={selected} isFever={isFever} type={type} />
        </div>
      );

    case ElementType.WATER:
      // Aqua: Blue, droplet shape (wide bottom, narrow top)
      return (
        <div className={bodyWrapper}>
           <div className={`absolute inset-0 rounded-full bg-cyan-400 blur-md opacity-40 transition-opacity ${selected ? 'opacity-80' : ''}`}></div>
           
           {/* Body: Droplet shape */}
           <div className="absolute inset-1 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] border-b-4 border-blue-700/20">
              {/* Wet Shine */}
              <div className="absolute top-2 left-2 w-3 h-3 bg-white/60 rounded-full blur-[1px]"></div>
           </div>

           <Face selected={selected} isFever={isFever} type={type} />
        </div>
      );

    case ElementType.NATURE:
      // Leafy: Green, round with leaf ears
      return (
        <div className={bodyWrapper}>
            <div className={`absolute inset-0 rounded-full bg-green-400 blur-md opacity-40 transition-opacity ${selected ? 'opacity-80' : ''}`}></div>
            
            {/* Body */}
            <div className="absolute inset-1 bg-gradient-to-b from-green-400 to-emerald-600 rounded-full shadow-inner">
                 <div className="absolute bottom-0 w-full h-1/3 bg-emerald-700/20 rounded-b-full"></div>
            </div>

            {/* Leaf Ears */}
            <div className="absolute -top-1 left-2 w-4 h-6 bg-green-500 rounded-full rounded-tl-none -rotate-[30deg] border-l border-green-300"></div>
            <div className="absolute -top-1 right-2 w-4 h-6 bg-green-500 rounded-full rounded-tr-none rotate-[30deg] border-r border-green-300"></div>

            <Face selected={selected} isFever={isFever} type={type} />
        </div>
      );

    case ElementType.PRISM:
        // Star Spirit: Multi-colored, glowing, star shape
        // Prism doesn't really have a "face" in the same way, but let's give it one to make it a character
      return (
        <div className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${isFever ? 'scale-125' : ''}`}>
             
             {/* Spinning Aura */}
             <div className="absolute inset-[-10px] bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 rounded-full blur-md opacity-60 animate-spin-slow"></div>

             {/* Star Body */}
             <div className="relative w-full h-full animate-spin-slow">
                 {/* CSS Star shape construction or just a fancy diamond */}
                 <div className="absolute inset-2 bg-gradient-to-br from-white via-purple-200 to-fuchsia-300 rounded-lg rotate-45 shadow-[0_0_15px_rgba(255,255,255,0.8)] border-2 border-white"></div>
                 <div className="absolute inset-2 bg-gradient-to-br from-white via-cyan-200 to-blue-300 rounded-lg rotate-[22.5deg] mix-blend-overlay"></div>
             </div>

             {/* Face on top of the spinning star */}
             <div className="absolute inset-0 z-10 scale-75">
                 <Face selected={selected} isFever={isFever} type={type} />
             </div>
        </div>
      );

    default:
      return <div className="w-full h-full rounded-full bg-gray-500" />;
  }
};

export default OrbVisual;
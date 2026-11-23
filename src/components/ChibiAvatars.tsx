import React from 'react';
import { GestureType } from '../types';

export const DEFAULT_CHARACTER_IMAGES: Record<GestureType | 'celebration', string> = {
  left_hand_up: './assets/aistudio/image-Photoroom__16__f7187325.png',
  right_hand_up: './assets/aistudio/image-Photoroom__17__25f4920a.png',
  arms_spread: './assets/aistudio/image-Photoroom__18__f6bed15d.png',
  both_hands_up: './assets/aistudio/image-Photoroom__19__caa06582.png',
  celebration: './assets/aistudio/image-Photoroom__20__1b7961ff.png',
  none: '',
};

interface ChibiProps {
  className?: string;
  pose: GestureType | 'celebration';
  customImage?: string;
}

export const ChibiAvatar: React.FC<ChibiProps> = ({ pose, customImage, className = "w-20 h-20" }) => {
  const imgSrc = customImage || DEFAULT_CHARACTER_IMAGES[pose];

  if (imgSrc) {
    return (
      <div className={`relative flex items-center justify-center transition-transform duration-300 hover:scale-105 ${className}`}>
        <img
          src={imgSrc}
          alt={pose}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(244,114,182,0.3)] select-none pointer-events-none"
          onError={(e) => {
            // fallback to SVG if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return null;
};

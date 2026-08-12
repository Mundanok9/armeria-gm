import React from 'react';
import { TipoArmamento } from '../types/index';

interface FirearmSilhouetteProps {
  tipo: TipoArmamento | string;
  className?: string;
}

export const FirearmSilhouette: React.FC<FirearmSilhouetteProps> = ({ tipo, className = '' }) => {
  const normType = tipo ? tipo.toUpperCase().trim() : '';

  // Render SVG based on Firearm Type
  switch (normType) {
    case 'REVOLVER':
      return (
        <svg
          viewBox="0 0 200 100"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          {/* Revolver Silhouette */}
          <g>
            {/* Long Barrel */}
            <path d="M 100 28 L 185 28 C 187 28 188 29 188 31 L 188 37 C 188 39 187 40 185 40 L 100 40 Z" />
            {/* Front Sight */}
            <path d="M 175 22 L 183 28 L 172 28 Z" />
            {/* Ejector Rod under barrel */}
            <path d="M 105 42 L 150 42 L 150 45 L 105 45 Z" />
            {/* Cylinder */}
            <rect x="72" y="27" width="28" height="26" rx="3" />
            {/* Cylinder Flutes/Grooves */}
            <line x1="75" y1="33" x2="97" y2="33" stroke="currentColor" strokeWidth="1.5" className="text-slate-900" />
            <line x1="75" y1="40" x2="97" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-slate-900" />
            <line x1="75" y1="47" x2="97" y2="47" stroke="currentColor" strokeWidth="1.5" className="text-slate-900" />
            {/* Frame & Receiver */}
            <path d="M 50 30 C 50 25 65 24 72 25 L 100 25 L 100 50 L 72 53 C 65 54 58 50 55 45 Z" />
            {/* Hammer */}
            <path d="M 48 28 C 44 22 42 18 38 18 C 36 18 36 21 39 24 C 43 28 47 31 49 34 Z" />
            {/* Trigger Guard & Trigger */}
            <path d="M 70 52 C 70 66 52 66 52 52 L 48 52 C 48 71 75 71 75 52 Z" />
            <path d="M 61 54 C 59 58 57 62 64 62 C 63 58 63 55 61 54 Z" />
            {/* Curved Grip */}
            <path d="M 52 50 C 48 55 42 63 35 72 C 28 81 22 88 15 92 C 11 94 8 91 10 86 C 14 78 22 66 28 55 C 34 45 42 36 48 32 Z" />
          </g>
        </svg>
      );

    case 'PISTOLA':
      return (
        <svg
          viewBox="0 0 200 100"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          {/* Semi-automatic Pistol Silhouette */}
          <g>
            {/* Slide */}
            <path d="M 40 22 L 180 22 C 183 22 185 24 185 27 L 183 45 L 38 45 C 36 45 35 43 35 41 L 37 25 C 37 23 38 22 40 22 Z" />
            {/* Front & Rear Sights */}
            <path d="M 172 17 L 178 22 L 168 22 Z" />
            <path d="M 42 18 L 47 18 L 47 22 L 42 22 Z" />
            {/* Serrations on Slide */}
            <line x1="48" y1="26" x2="48" y2="40" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
            <line x1="53" y1="26" x2="53" y2="40" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
            <line x1="58" y1="26" x2="58" y2="40" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
            <line x1="63" y1="26" x2="63" y2="40" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
            {/* Ejection Port Notch */}
            <rect x="105" y="24" width="22" height="10" rx="1" className="text-slate-900" fill="currentColor" />
            {/* Frame & Dust Cover under barrel */}
            <path d="M 38 45 L 180 45 L 178 52 L 85 52 C 80 52 75 56 72 60 L 68 88 C 66 92 62 94 57 94 L 38 94 C 34 94 32 91 33 86 L 45 48 Z" />
            {/* Beavertail */}
            <path d="M 37 42 C 30 40 24 35 20 32 C 22 38 28 44 35 46 Z" />
            {/* Trigger Guard & Trigger */}
            <path d="M 85 52 C 85 70 65 70 65 54 L 60 54 C 60 75 90 75 90 52 Z" />
            <path d="M 76 55 C 73 60 72 65 78 65 C 78 61 78 57 76 55 Z" />
            {/* Magazine Baseplate */}
            <path d="M 35 94 L 59 94 L 58 98 L 33 98 Z" />
          </g>
        </svg>
      );

    case 'CARABINA':
      return (
        <svg
          viewBox="0 0 240 100"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          {/* Tactical Carbine Silhouette */}
          <g>
            {/* Barrel & Flash Hider */}
            <rect x="180" y="36" width="45" height="6" rx="1" />
            <path d="M 225 34 L 235 34 L 235 44 L 225 44 Z" />
            {/* Handguard / Quad Rail */}
            <rect x="115" y="32" width="68" height="14" rx="2" />
            {/* Rail Slots */}
            <line x1="120" y1="39" x2="180" y2="39" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
            {/* Upper & Lower Receiver */}
            <path d="M 75 28 L 115 28 L 115 48 L 75 48 Z" />
            {/* Top Picatinny Rail */}
            <rect x="70" y="24" width="110" height="4" />
            {/* Compact Carry Handle or Sight */}
            <path d="M 90 16 L 125 16 L 130 24 L 85 24 Z" />
            {/* Curved Magazine */}
            <path d="M 100 48 L 112 48 C 114 62 120 78 128 88 L 112 92 C 102 80 96 64 96 48 Z" />
            {/* Pistol Grip */}
            <path d="M 78 48 C 76 58 72 70 65 78 C 62 81 56 81 55 76 C 58 68 64 58 66 48 Z" />
            {/* Trigger Guard */}
            <path d="M 94 48 C 94 60 80 60 80 48 Z" />
            {/* Buffer Tube & Stock */}
            <rect x="35" y="35" width="42" height="8" />
            <path d="M 10 30 L 40 33 L 38 58 L 10 65 C 8 65 7 62 7 58 L 7 35 C 7 31 8 30 10 30 Z" />
          </g>
        </svg>
      );

    case 'ESPINGARDA':
      return (
        <svg
          viewBox="0 0 250 100"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          {/* Long Barrel Shotgun Silhouette */}
          <g>
            {/* Long Dual Barrel / Barrel & Mag Tube */}
            <rect x="90" y="34" width="145" height="6" rx="1" />
            <rect x="100" y="41" width="120" height="5" rx="1" />
            {/* Front Bead Sight */}
            <circle cx="232" cy="32" r="2" />
            {/* Pump Forend / Wooden Handguard */}
            <rect x="135" y="39" width="50" height="11" rx="3" />
            <line x1="140" y1="44" x2="180" y2="44" stroke="currentColor" strokeWidth="1.5" className="text-slate-900" />
            {/* Receiver */}
            <path d="M 55 30 L 95 30 L 95 48 L 55 48 Z" />
            {/* Trigger Guard & Trigger */}
            <path d="M 72 48 C 72 60 58 60 58 48 Z" />
            <path d="M 66 50 C 64 54 63 56 67 56 Z" />
            {/* Wooden/Synthetic Full Stock */}
            <path d="M 55 32 C 45 35 32 40 20 48 C 12 53 8 62 5 72 C 4 75 7 78 11 78 C 22 76 35 62 48 50 L 55 48 Z" />
          </g>
        </svg>
      );

    case 'FUZIL':
      return (
        <svg
          viewBox="0 0 250 100"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          {/* Military Assault Rifle (AK / FAL / M4 style) Silhouette */}
          <g>
            {/* Long Barrel & Muzzle Brake */}
            <rect x="160" y="36" width="75" height="5" />
            <path d="M 235 33 L 245 33 L 245 44 L 235 44 Z" />
            {/* Front Sight Post / Gas Block */}
            <path d="M 205 24 L 212 36 L 200 36 Z" />
            <rect x="200" y="36" width="12" height="8" />
            {/* Handguard */}
            <path d="M 125 31 L 180 31 L 175 48 L 125 48 Z" />
            <line x1="130" y1="39" x2="170" y2="39" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
            {/* Main Receiver */}
            <path d="M 70 28 L 125 28 L 125 50 L 70 50 Z" />
            {/* Rear Sight / Carrying Handle Scope */}
            <path d="M 80 18 L 115 18 L 120 28 L 75 28 Z" />
            {/* Banana Curved High-Cap Magazine */}
            <path d="M 105 50 C 112 62 122 75 136 88 L 118 94 C 102 78 94 62 90 50 Z" />
            {/* Pistol Grip */}
            <path d="M 75 50 C 73 60 68 72 60 82 C 56 85 50 84 50 78 C 55 68 62 58 64 50 Z" />
            {/* Trigger Guard */}
            <path d="M 88 50 C 88 62 74 62 74 50 Z" />
            {/* Tactical Fixed / Skeleton Stock */}
            <path d="M 10 32 L 70 30 L 70 48 L 10 65 C 7 66 5 62 5 58 L 5 38 C 5 34 7 32 10 32 Z" />
            <circle cx="35" cy="45" r="8" className="text-slate-900" fill="currentColor" />
          </g>
        </svg>
      );

    case 'SUBMETRALHADORA':
      return (
        <svg
          viewBox="0 0 200 100"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          {/* Submachine Gun (SMG) Silhouette */}
          <g>
            {/* Short Barrel & Suppressor/Muzzle */}
            <rect x="135" y="35" width="40" height="8" rx="2" />
            {/* Front Sight */}
            <path d="M 132 28 L 138 35 L 128 35 Z" />
            {/* Upper Receiver & Shroud */}
            <rect x="70" y="28" width="65" height="18" rx="2" />
            <line x1="80" y1="34" x2="125" y2="34" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
            {/* Long Vertical Magazine */}
            <rect x="95" y="46" width="14" height="48" rx="2" transform="rotate(-5 102 70)" />
            {/* Pistol Grip */}
            <path d="M 72 46 C 70 56 66 68 58 76 C 55 79 50 78 50 73 C 54 64 60 54 62 46 Z" />
            {/* Trigger Guard */}
            <path d="M 86 46 C 86 58 72 58 72 46 Z" />
            {/* Folding Wire Stock */}
            <path d="M 15 36 L 70 32 L 70 38 L 20 42 Z" />
            <path d="M 15 36 L 15 65 L 22 65 L 22 42 Z" />
          </g>
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 200 100"
          fill="currentColor"
          className={className}
          aria-hidden="true"
        >
          {/* Generic Firearm / Tactical Weapon Icon */}
          <g>
            <path d="M 30 25 L 170 25 L 165 42 L 80 42 L 65 85 L 42 85 L 55 42 L 30 42 Z" />
            <path d="M 80 42 C 80 60 62 60 62 42 Z" />
          </g>
        </svg>
      );
  }
};

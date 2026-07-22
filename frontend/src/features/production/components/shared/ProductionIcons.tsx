export const InjectionMoldingIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base of machine */}
    <rect x="20" y="300" width="472" height="160" rx="12" fill="#E2E8F0" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />

    {/* Control Screen on Base */}
    <rect x="50" y="335" width="100" height="90" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="16" strokeLinejoin="round" />
    <line x1="65" y1="365" x2="135" y2="365" stroke="#3B82F6" strokeWidth="10" strokeLinecap="round" />
    <line x1="65" y1="395" x2="115" y2="395" stroke="#94A3B8" strokeWidth="10" strokeLinecap="round" />

    {/* Buttons on Base */}
    <rect x="180" y="360" width="40" height="30" rx="4" fill="#64748B" stroke="#0F172A" strokeWidth="12" strokeLinejoin="round" />
    <rect x="240" y="360" width="40" height="30" rx="4" fill="#64748B" stroke="#0F172A" strokeWidth="12" strokeLinejoin="round" />
    <rect x="300" y="360" width="40" height="30" rx="4" fill="#64748B" stroke="#0F172A" strokeWidth="12" strokeLinejoin="round" />

    {/* Bottom slits */}
    <line x1="370" y1="425" x2="370" y2="445" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
    <line x1="410" y1="425" x2="410" y2="445" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
    <line x1="450" y1="425" x2="450" y2="445" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />

    {/* Clamping unit / Mold plate (Left) */}
    <rect x="30" y="120" width="250" height="180" rx="8" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    {/* Mold window/cavity */}
    <rect x="65" y="150" width="180" height="120" rx="6" fill="#94A3B8" stroke="#0F172A" strokeWidth="18" strokeLinejoin="round" />
    <line x1="155" y1="150" x2="155" y2="270" stroke="#0F172A" strokeWidth="14" />

    {/* Injection Cylinder/Nozzle (Middle) */}
    <path d="M245 210l65-20v40z" fill="#64748B" stroke="#0F172A" strokeWidth="16" strokeLinejoin="round" />
    <rect x="310" y="185" width="40" height="50" rx="4" fill="#475569" stroke="#0F172A" strokeWidth="16" strokeLinejoin="round" />

    {/* Hopper / Barrel unit (Right) */}
    <rect x="350" y="200" width="70" height="100" rx="6" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    <rect x="365" y="100" width="40" height="100" fill="#94A3B8" stroke="#0F172A" strokeWidth="18" strokeLinejoin="round" />
    {/* Hopper funnel */}
    <path d="M325 50h120l-25 50h-70z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    {/* Right side box/cabinet */}
    <rect x="410" y="110" width="75" height="100" rx="8" fill="#94A3B8" stroke="#0F172A" strokeWidth="18" strokeLinejoin="round" />
  </svg>
);

export const PaintingRobotIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base turntable / curved body at the bottom */}
    <path d="M230 460h80" stroke="#0F172A" strokeWidth="24" strokeLinecap="round" />
    <path d="M270 360v100" stroke="#0F172A" strokeWidth="24" strokeLinecap="round" />
    <path
      d="M220 370c-25 0-45-20-45-45s20-45 45-45h100c25 0 45 20 45 45s-20 45-45 45z"
      fill="#CBD5E1"
      stroke="#0F172A"
      strokeWidth="20"
      strokeLinejoin="round"
    />

    {/* Controller base panel on bottom right */}
    <rect x="330" y="340" width="130" height="120" rx="16" fill="#E2E8F0" stroke="#0F172A" strokeWidth="20" strokeLinejoin="round" />
    <circle cx="370" cy="380" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="12" />
    <circle cx="370" cy="420" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="12" />
    <line x1="405" y1="380" x2="435" y2="380" stroke="#0F172A" strokeWidth="16" strokeLinecap="round" />
    <line x1="405" y1="420" x2="435" y2="420" stroke="#0F172A" strokeWidth="16" strokeLinecap="round" />

    {/* Lower arm segment */}
    <path d="M270 280L410 110" stroke="#0F172A" strokeWidth="52" strokeLinecap="round" />
    <path d="M270 280L410 110" stroke="#94A3B8" strokeWidth="32" strokeLinecap="round" />
    <line x1="300" y1="243" x2="380" y2="147" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />

    {/* Elbow Joint (Top Right) */}
    <circle cx="410" cy="110" r="40" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" />
    <circle cx="410" cy="110" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="10" />

    {/* Upper arm segment */}
    <path d="M410 110L200 60" stroke="#0F172A" strokeWidth="52" strokeLinecap="round" />
    <path d="M410 110L200 60" stroke="#94A3B8" strokeWidth="32" strokeLinecap="round" />
    <line x1="375" y1="102" x2="235" y2="68" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />

    {/* Wrist Joint (Left) */}
    <circle cx="200" cy="60" r="40" fill="#CBD5E1" stroke="#0F172A" strokeWidth="20" />
    <circle cx="200" cy="60" r="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="10" />

    {/* Nozzle Mount */}
    <path d="M180 80l-35 35" stroke="#0F172A" strokeWidth="24" strokeLinecap="round" />
    {/* Nozzle tip */}
    <path
      d="M145 115l-15 15c-6 6-16 6-22 0l-10-10c-6-6-6-16 0-22l15-15z"
      fill="#E2E8F0"
      stroke="#0F172A"
      strokeWidth="20"
      strokeLinejoin="round"
    />
    <path d="M110 100l-25 25" stroke="#0F172A" strokeWidth="20" strokeLinecap="round" />

    {/* Spray paint mist/dashed lines */}
    <path d="M70 140L10 150" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
    <path d="M75 165L20 200" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
    <path d="M80 185L35 250" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
    <path d="M85 200L55 295" stroke="#0F172A" strokeWidth="20" strokeDasharray="20 20" strokeLinecap="round" />
  </svg>
);

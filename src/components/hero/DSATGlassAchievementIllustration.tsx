import React from "react";

export function DSATGlassAchievementIllustration() {
  return (
    <div className="relative h-full w-full">
      {/* Background glow layers */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
        <div className="absolute left-[-20%] top-[-20%] h-[180px] w-[180px] rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute right-[-20%] bottom-[-30%] h-[220px] w-[220px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_32%)]" />

        {/* Soft glass grain */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 20%, rgba(96,165,250,0.35), transparent 40%), radial-gradient(circle at 90% 70%, rgba(250,204,21,0.25), transparent 45%)",
          }}
        />
      </div>

      {/* Scene wrapper */}
      <div className="relative h-full w-full">
        {/* Floating stars + particles */}
        <FloatingStars />

        {/* Circular progress ring */}
        <div className="absolute left-1/2 top-1/2 h-[140px] w-[140px] -translate-x-1/2 -translate-y-[6px]">
          <ProgressRing value={72} />
        </div>

        {/* Book + cap + cards */}
        <div className="absolute inset-0">
          <div className="absolute left-[28%] top-[16%] h-[70px] w-[70px] animate-[float_5s_ease-in-out_infinite]">
            <GraduationCap />
          </div>

          <div className="absolute left-[16%] top-[46%] h-[110px] w-[140px]">
            <OpenBook />
          </div>

          {/* Study cards */}
          <div className="absolute left-[58%] top-[28%] h-[84px] w-[110px] animate-[float_6s_ease-in-out_infinite]">
            <StudyCard variant="blue" />
          </div>
          <div className="absolute left-[46%] top-[58%] h-[76px] w-[110px] animate-[float_7s_ease-in-out_infinite]">
            <StudyCard variant="indigo" />
          </div>
          <div className="absolute left-[66%] top-[60%] h-[70px] w-[96px] animate-[float_8s_ease-in-out_infinite]">
            <StudyCard variant="gold" />
          </div>

          {/* Perspective glow */}
          <div className="absolute left-[22%] top-[73%] h-[40px] w-[180px] -translate-y-1 rounded-full bg-sky-400/10 blur-xl" />
        </div>
      </div>

      {/* Tailwind keyframes (inline via style) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-8px) translateX(2px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-30%); opacity: 0; }
          25% { opacity: 0.9; }
          60% { opacity: 0.4; }
          100% { transform: translateX(30%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function GraduationCap() {
  return (
    <div className="relative h-full w-full">
      {/* glass shadow */}
      <div className="absolute -bottom-2 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-xl" />

      {/* Cap base */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full drop-shadow-[0_18px_45px_rgba(56,189,248,0.22)]"
          aria-hidden
        >
          <defs>
            <linearGradient id="capGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.35" />
              <stop offset="55%" stopColor="#60a5fa" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0.20" />
            </linearGradient>
            <linearGradient id="capGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
            </linearGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Top glass planes */}
          <path
            d="M50 16 L90 34 L50 52 L10 34 Z"
            fill="url(#capGlass)"
            stroke="#e0f2fe"
            strokeOpacity="0.35"
            strokeWidth="1.6"
            filter="url(#softGlow)"
          />

          {/* Middle rim */}
          <path
            d="M50 52 L90 34 L90 41 L50 59 Z"
            fill="#0b1220"
            fillOpacity="0.25"
            stroke="#93c5fd"
            strokeOpacity="0.25"
            strokeWidth="1.2"
          />

          {/* Gold trim */}
          <path
            d="M50 22 L80 35 L50 48 L20 35 Z"
            fill="none"
            stroke="url(#capGold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Tassel */}
          <path
            d="M50 52 C49 66 48 72 41 82"
            fill="none"
            stroke="#facc15"
            strokeOpacity="0.9"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="41" cy="82" r="6.2" fill="#facc15" fillOpacity="0.95" />
          <circle cx="41" cy="82" r="10" fill="#facc15" fillOpacity="0.15" />
        </svg>
      </div>

      {/* Glimmer sweep */}
      <div className="absolute inset-0 rounded-[1.5rem] bg-[linear-gradient(110deg,transparent_0%,rgba(250,204,21,0.35)_35%,transparent_70%)] opacity-60 animate-[shimmer_4.6s_ease-in-out_infinite]" />
    </div>
  );
}

function OpenBook() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,rgba(147,197,253,0.22),transparent_55%)]" />

      <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="bookGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#0ea5e9" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0.10" />
          </linearGradient>
          <linearGradient id="page" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.22" />
          </linearGradient>
          <filter id="bookShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Book spine base */}
        <path
          d="M40 86 C62 72 92 68 112 70 C150 74 160 92 160 92 L160 126 C160 126 146 112 110 110 C82 108 62 114 40 124 Z"
          fill="#0b1220"
          fillOpacity="0.28"
          stroke="#93c5fd"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />

        {/* Left page */}
        <path
          d="M44 86 C58 76 82 70 108 72 C108 72 110 84 110 94 C110 112 110 120 110 120 C84 116 62 120 44 130 Z"
          fill="url(#page)"
          stroke="#ffffff"
          strokeOpacity="0.26"
          strokeWidth="1.4"
        />

        {/* Right page */}
        <path
          d="M110 94 C110 84 108 72 108 72 C130 66 150 76 160 92 L160 126 C160 126 150 112 110 120 Z"
          fill="url(#bookGlass)"
          stroke="#60a5fa"
          strokeOpacity="0.25"
          strokeWidth="1.4"
        />

        {/* Inner lines */}
        <path
          d="M78 84 L104 86"
          stroke="#93c5fd"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M78 98 L104 100"
          stroke="#ffffff"
          strokeOpacity="0.25"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M78 112 L104 113"
          stroke="#facc15"
          strokeOpacity="0.25"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Spark */}
        <circle cx="48" cy="94" r="5" fill="#facc15" fillOpacity="0.8" />
        <circle cx="48" cy="94" r="12" fill="#facc15" fillOpacity="0.12" />
      </svg>
    </div>
  );
}

function StudyCard({ variant }: { variant: "blue" | "indigo" | "gold" }) {
  const palette =
    variant === "blue"
      ? {
          a: "from-sky-500/25",
          b: "to-indigo-500/20",
          stroke: "rgba(147,197,253,0.45)",
          text: "#e0f2fe",
        }
      : variant === "indigo"
        ? {
            a: "from-indigo-500/25",
            b: "to-sky-500/15",
            stroke: "rgba(99,102,241,0.45)",
            text: "#e0e7ff",
          }
        : {
            a: "from-amber-500/25",
            b: "to-yellow-400/15",
            stroke: "rgba(250,204,21,0.55)",
            text: "#fff7d1",
          };

  return (
    <div className="relative h-full w-full">
      <div
        className={`absolute inset-0 rounded-[1.5rem] bg-gradient-to-br ${palette.a} ${palette.b} backdrop-blur-xl border border-white/20 shadow-[0_30px_70px_-40px_rgba(56,189,248,0.55)]`}
      />
      <div className="absolute -top-1 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-white/5 blur-xl" />

      <svg viewBox="0 0 140 90" className="relative h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`scan-${variant}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <path
          d="M18 22 H118"
          stroke={palette.stroke}
          strokeOpacity="0.9"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M18 42 H102"
          stroke={palette.stroke}
          strokeOpacity="0.6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M18 62 H92"
          stroke={palette.stroke}
          strokeOpacity="0.35"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* small star seal */}
        <path
          d="M103 16 L105 21 L110 23 L105 25 L103 30 L101 25 L96 23 L101 21 Z"
          fill="#facc15"
          fillOpacity="0.85"
        />

        {/* scan glint */}
        <rect
          x="28"
          y="12"
          width="10"
          height="70"
          fill={`url(#scan-${variant})`}
          opacity="0.8"
          transform="rotate(14 28 12)"
        />
      </svg>

      <div className="absolute inset-0 rounded-[1.5rem] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.28)_35%,transparent_70%)] opacity-30 animate-[shimmer_5.2s_ease-in-out_infinite]" />
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 46;
  const stroke = 10;
  const c = 2 * Math.PI * radius;
  const dash = (clamped / 100) * c;

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.18),transparent_62%)]" />

      <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="ringBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.95" />
          </linearGradient>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.14"
          strokeWidth={stroke}
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#ringBlue)"
          strokeOpacity="0.95"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 70 70)"
          filter="url(#ringGlow)"
        />

        {/* inner glass */}
        <circle
          cx="70"
          cy="70"
          r="30"
          fill="#0b1220"
          fillOpacity="0.12"
          stroke="#93c5fd"
          strokeOpacity="0.16"
        />

        {/* center label */}
        <text
          x="70"
          y="73"
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fill="#ffffff"
          fillOpacity="0.92"
        >
          +{clamped}%
        </text>
        <text
          x="70"
          y="93"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#facc15"
          fillOpacity="0.85"
        >
          Progress
        </text>

        {/* micro sparkles */}
        <circle cx="26" cy="62" r="3.2" fill="#facc15" fillOpacity="0.85" />
        <circle cx="114" cy="84" r="2.8" fill="#facc15" fillOpacity="0.75" />
      </svg>

      <div className="absolute inset-0 rounded-full animate-ring-pulse-slow bg-transparent" />
    </div>
  );
}

function FloatingStars() {
  return (
    <div aria-hidden className="absolute inset-0">
      {/* Stars */}
      <div className="absolute left-[66%] top-[18%] h-12 w-12 animate-[float_5.5s_ease-in-out_infinite]">
        <Star3D size={48} color="#facc15" />
      </div>
      <div className="absolute left-[18%] top-[24%] h-10 w-10 animate-[float_7.5s_ease-in-out_infinite]">
        <Star3D size={40} color="#93c5fd" />
      </div>
      <div className="absolute left-[54%] top-[64%] h-8 w-8 animate-[float_6.6s_ease-in-out_infinite]">
        <Star3D size={34} color="#facc15" />
      </div>

      {/* Gold particles */}
      <Particle x="18%" y="62%" delay="0s" />
      <Particle x="82%" y="34%" delay="0.4s" />
      <Particle x="62%" y="78%" delay="0.8s" />
      <Particle x="44%" y="18%" delay="1.2s" />
    </div>
  );
}

function Star3D({ size, color }: { size: number; color: string }) {
  const id = `star-${size}-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="h-full w-full drop-shadow-[0_10px_30px_rgba(250,204,21,0.18)]"
      aria-hidden
    >
      <defs>
        <radialGradient id={id} cx="30%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="40%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <path
        d="M32 6 L38.5 22.2 L56 23.8 L42.7 34.1 L47.2 51.1 L32 42.3 L16.8 51.1 L21.3 34.1 L8 23.8 L25.5 22.2 Z"
        fill={`url(#${id})`}
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="1.2"
        transform="translate(0,0)"
      />
      <path
        d="M32 10 L37 23 L52 24.4 L41 32.8 L45.1 46.8 L32 39.1 L18.9 46.8 L23 32.8 L12 24.4 L27 23 Z"
        fill="#0b1220"
        fillOpacity="0.08"
      />
    </svg>
  );
}

function Particle({ x, y, delay }: { x: string; y: string; delay: string }) {
  return (
    <div
      className="absolute h-2 w-2 rounded-full bg-amber-300/80 blur-[0.2px]"
      style={{
        left: x,
        top: y,
        animation: `floatParticle 3.8s ease-in-out ${delay} infinite`,
      }}
    />
  );
}

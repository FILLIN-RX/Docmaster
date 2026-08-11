interface PortalAuthBackgroundProps {
  palette: {
    primary: string;
    greenDark: string;
    greenMid: string;
  };
  variant: "shield" | "building";
  background: string;
  children?: React.ReactNode;
}

export default function PortalAuthBackground({ palette, variant, background, children }: PortalAuthBackgroundProps) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflow: "hidden",
        backgroundColor: background,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
      >
        <defs>
          <pattern id="dm-auth-dots" width="38" height="38" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#FFFFFF" opacity="0.055" />
          </pattern>
          <linearGradient id="dm-auth-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={palette.greenMid} />
            <stop offset="0.5" stopColor={palette.primary} />
            <stop offset="1" stopColor={palette.greenMid} />
          </linearGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#dm-auth-dots)" />

        <circle cx="720" cy="450" r="460" fill={palette.primary} opacity="0.06" />

        {variant === "shield" ? (
          <g fill="none" stroke={palette.primary} strokeOpacity="0.35" strokeWidth="3">
            <path d="M 300 120 C 330 130 370 130 400 120 L 400 240 C 400 300 360 330 350 340 C 340 330 300 300 300 240 Z" />
            <circle cx="350" cy="200" r="26" strokeOpacity="0.45" />
            <path d="M 350 182 L 350 218 M 332 200 L 368 200" strokeOpacity="0.45" />
            <path d="M 322 246 L 322 256 M 378 246 L 378 256" />
          </g>
        ) : (
          <g fill="none" stroke={palette.primary} strokeOpacity="0.35" strokeWidth="3">
            <path d="M 280 160 L 330 130 L 380 160 L 380 280 L 280 280 Z" />
            <path d="M 305 195 L 355 195 M 305 220 L 355 220 M 305 245 L 355 245" strokeOpacity="0.45" />
          </g>
        )}

        <g fill={palette.primary} fillOpacity="0.18">
          <path d="M 1080 170 L 1160 170 L 1160 250 L 1080 250 Z" stroke={palette.primary} strokeOpacity="0.3" strokeWidth="2" fillOpacity="0.06" />
          <path d="M 1160 170 L 1190 200 L 1160 200 Z" />
          <path d="M 1096 200 L 1144 200 M 1096 218 L 1144 218 M 1096 236 L 1124 236" stroke={palette.primary} strokeOpacity="0.3" strokeWidth="2" />
        </g>
        <g fill={palette.primary} fillOpacity="0.14">
          <path d="M 1010 260 L 1074 260 L 1074 324 L 1010 324 Z" stroke={palette.primary} strokeOpacity="0.25" strokeWidth="2" fillOpacity="0.05" />
          <path d="M 1074 260 L 1096 282 L 1074 282 Z" />
        </g>

        <path
          d="M 0 760 C 240 700 420 820 720 770 C 1020 720 1200 840 1440 770 L 1440 900 L 0 900 Z"
          fill="url(#dm-auth-wave)"
          opacity="0.14"
        />
      </svg>

      {children}
    </div>
  );
}

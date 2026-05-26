export type LucideIcon = (props: IconProps) => JSX.Element;

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

function Icon({ children, size = 20, strokeWidth = 2, ...props }: IconProps & { children: JSX.Element | JSX.Element[] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return <Icon {...props}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Icon>;
}

export function BookOpenText(props: IconProps) {
  return <Icon {...props}><path d="M12 7v14" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H12V5H6.5A2.5 2.5 0 0 0 4 7.5z" /><path d="M20 19.5A2.5 2.5 0 0 0 17.5 17H12V5h5.5A2.5 2.5 0 0 1 20 7.5z" /><path d="M8 9h1" /><path d="M8 13h1" /></Icon>;
}

export function CalendarDays(props: IconProps) {
  return <Icon {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /></Icon>;
}

export function CalendarCheck2(props: IconProps) {
  return <Icon {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="m9 16 2 2 4-5" /></Icon>;
}

export function CalendarPlus(props: IconProps) {
  return <Icon {...props}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M12 14v5" /><path d="M9.5 16.5h5" /></Icon>;
}

export function ChartLine(props: IconProps) {
  return <Icon {...props}><path d="M3 3v18h18" /><path d="m6 16 4-5 4 3 5-8" /></Icon>;
}

export function CheckCircle2(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></Icon>;
}

export function ChevronRight(props: IconProps) {
  return <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>;
}

export function Download(props: IconProps) {
  return <Icon {...props}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></Icon>;
}

export function Eraser(props: IconProps) {
  return <Icon {...props}><path d="m7 21-4-4L14 6l4 4L7 21z" /><path d="m11 10 4 4" /><path d="M12 21h9" /></Icon>;
}

export function ExternalLink(props: IconProps) {
  return <Icon {...props}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Icon>;
}

export function Home(props: IconProps) {
  return <Icon {...props}><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /><path d="M9 21v-6h6v6" /></Icon>;
}

export function MessageSquareCheck(props: IconProps) {
  return <Icon {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="m8 11 2 2 5-5" /></Icon>;
}

export function Send(props: IconProps) {
  return <Icon {...props}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></Icon>;
}

export function StickyNote(props: IconProps) {
  return <Icon {...props}><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z" /><path d="M16 3v5h5" /><path d="M8 12h8" /><path d="M8 16h6" /></Icon>;
}

export function WandSparkles(props: IconProps) {
  return <Icon {...props}><path d="m4 20 11-11" /><path d="m13 5 6 6" /><path d="M6 4h.01" /><path d="M19 19h.01" /><path d="M10 2h.01" /></Icon>;
}

export function X(props: IconProps) {
  return <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
}

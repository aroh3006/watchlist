import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (children: React.ReactNode, props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={20}
    height={20}
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const HomeIcon = (p: IconProps) => base(<path d="M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10" />, p);
export const TvIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="5" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </>,
    p
  );
export const FilmIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>,
    p
  );
export const CompassIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-1.8 5.2-5.2 1.8 1.8-5.2z" />
    </>,
    p
  );
export const CalendarIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>,
    p
  );
export const ListIcon = (p: IconProps) => base(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />, p);
export const BarChartIcon = (p: IconProps) => base(<path d="M4 20V10M12 20V4M20 20v-7" />, p);
export const UserIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </>,
    p
  );
export const CheckCircleIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>,
    p
  );
export const PlusIcon = (p: IconProps) => base(<path d="M12 5v14M5 12h14" />, p);
export const SearchIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
    p
  );
export const UploadIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>,
    p
  );
export const DownloadIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 4v12M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </>,
    p
  );
export const FlameIcon = (p: IconProps) =>
  base(<path d="M12 3s4 3.5 4 7.5a4 4 0 0 1-8 0c0-1 .5-2 1-2.5-.3 2 1.2 2.5 1.5 1 .3 1.5 1.5 1.5 1.5 2.5A4.5 4.5 0 0 1 7 15.5C7 20 12 21 12 21s7-1.5 7-8c0-4-3-6-3-6s1 2-1 3c0-3-3-7-3-7z" />, p);
export const StarIcon = (p: IconProps) => base(<path d="m12 3 2.8 5.9 6.2.6-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2-4.7-4.3 6.2-.6z" />, p);
export const TrophyIcon = (p: IconProps) =>
  base(
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 5H5a3 3 0 0 0 3 4M16 5h3a3 3 0 0 1-3 4" />
      <path d="M12 13v3M9 20h6M10 20v-4h4v4" />
    </>,
    p
  );
export const ArrowLeftIcon = (p: IconProps) => base(<path d="M19 12H5M11 18l-6-6 6-6" />, p);
export const XIcon = (p: IconProps) => base(<path d="M18 6 6 18M6 6l12 12" />, p);
export const MenuIcon = (p: IconProps) => base(<path d="M4 6h16M4 12h16M4 18h16" />, p);

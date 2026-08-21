const paths = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  compass: 'M12 2a10 10 0 100 20 10 10 0 000-20zM15 9l-2 6-6 2 2-6 6-2z',
  briefcase: 'M4 8h16v11H4zM9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M4 13h16',
  users: 'M17 21v-2a4 4 0 00-3-3.87M7 21v-2a4 4 0 013-3.87M13 7a4 4 0 11-8 0 4 4 0 018 0zM19 7a4 4 0 010 8',
  bell: 'M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 004 0',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.14.36.36.68.63.94.28.28.6.5.97.63V11a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  checkCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM8 12l3 3 5-6',
  xCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM15 9l-6 6M9 9l6 6',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
  link: 'M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07L12.5 19.5',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  mapPin: 'M12 22s7-7.58 7-13a7 7 0 10-14 0c0 5.42 7 13 7 13zM12 12a2 2 0 100-4 2 2 0 000 4z',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6',
  flag: 'M4 22V4a1 1 0 011-1h11l-1.5 5L20 13H5',
  lock: 'M6 11V7a6 6 0 1112 0v4M5 11h14v10H5z',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6h14z',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
  copy: 'M8 8h11a1 1 0 011 1v11a1 1 0 01-1 1H8a1 1 0 01-1-1V9a1 1 0 011-1zM5 16H4a1 1 0 01-1-1V4a1 1 0 011-1h11a1 1 0 011 1v1',
  share: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14',
  externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  userMinus: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M11 7a4 4 0 100 8 4 4 0 000-8zM19 8h-6',
  refresh: 'M3 12a9 9 0 0115.4-6.36L21 8M21 3v5h-5M21 12a9 9 0 01-15.4 6.36L3 16m0 5v-5h5',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  creditCard: 'M2 10h20M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z',
  alertTriangle: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  layers: 'M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
};

export default function Icon({ name, size = 18, strokeWidth = 2, className = '', filled = false, style, ...rest }) {
  const d = paths[name];
  if (!d) return null;
  const fillIcons = new Set(['star']);
  const isFilled = fillIcons.has(name) && filled;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

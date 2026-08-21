import { Link } from 'react-router-dom';

export default function Logo({ to = '/dashboard', size = 28, showWordmark = true, dark = false, className = '' }) {
  const mark = (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 10c-8 0-13 5-13 5" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
      <path d="M13 22c0 8 5 13 5 13" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
      <path d="M25 46c8 0 13-5 13-5" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
      <path d="M46 41c0-8-5-13-5-13" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="10" r="4" fill="#2563EB" />
      <circle cx="13" cy="22" r="4" fill="#2563EB" />
      <circle cx="25" cy="46" r="4" fill="#2563EB" />
      <circle cx="46" cy="41" r="4" fill="#2563EB" />
      <circle cx="30" cy="27" r="5" fill="#2563EB" />
    </svg>
  );

  const content = (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 800,
        fontSize: size * 0.68,
        color: dark ? '#ffffff' : '#0d1b2a',
        letterSpacing: '-0.01em',
      }}
    >
      {mark}
      {showWordmark && 'CollabNest'}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} aria-label="CollabNest home" style={{ display: 'inline-flex' }}>
      {content}
    </Link>
  );
}

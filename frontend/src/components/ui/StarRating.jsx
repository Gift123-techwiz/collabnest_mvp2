import { useState } from 'react';
import Icon from './Icon';

export default function StarRatingInput({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: n <= (hover || value) ? '#f5a623' : '#cbd1db',
          }}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Icon name="star" size={size} filled={n <= (hover || value)} />
        </button>
      ))}
    </div>
  );
}

export function StarRatingDisplay({ value, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} filled={n <= Math.round(value)} style={{ color: n <= Math.round(value) ? '#f5a623' : '#cbd1db' }} />
      ))}
    </div>
  );
}

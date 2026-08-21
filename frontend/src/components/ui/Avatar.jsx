import { getInitials } from '../../utils/constants';

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56, xl: 88 };

export default function Avatar({ src, name, size = 'md', style = {} }) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size] || 40;
  const fontSize = Math.max(11, px * 0.38);

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className="avatar"
        style={{ width: px, height: px, ...style }}
      />
    );
  }

  return (
    <span
      className="avatar"
      style={{ width: px, height: px, fontSize, ...style }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

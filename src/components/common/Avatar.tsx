import { useState } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hasStory?: boolean;
  hasUnviewed?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  xs: { wh: 24, ring: 1, pad: 1 },
  sm: { wh: 32, ring: 2, pad: 2 },
  md: { wh: 40, ring: 2, pad: 2 },
  lg: { wh: 56, ring: 2, pad: 2 },
  xl: { wh: 80, ring: 3, pad: 3 },
};

const fontSize = { xs: 10, sm: 12, md: 14, lg: 18, xl: 24 };

export default function Avatar({ src, alt = '', size = 'md', hasStory, hasUnviewed, onClick, className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { wh, ring, pad } = sizeMap[size];

  const showImg = !!src && !imgError;
  const initial = alt?.[0]?.toUpperCase() || '?';

  const storyGradient = hasStory && hasUnviewed
    ? 'linear-gradient(#fff, #fff) padding-box, linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888) border-box'
    : undefined;

  const containerStyle: React.CSSProperties = {
    width: wh,
    height: wh,
    borderRadius: '50%',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : undefined,
    border: hasStory
      ? `${ring}px solid ${hasUnviewed ? 'transparent' : '#555'}`
      : undefined,
    background: storyGradient,
    padding: hasStory ? pad : undefined,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    flexShrink: 0,
    ...(hasStory ? { border: '2px solid #000' } : {}),
  };

  return (
    <div
      style={containerStyle}
      onClick={onClick}
      className={className}
    >
      <div style={innerStyle}>
        {showImg ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ color: '#fff', fontWeight: 600, fontSize: fontSize[size], userSelect: 'none' }}>
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}

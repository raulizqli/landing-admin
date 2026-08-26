const ASSETS = {
  mark: '/brand/leftside-mark-square-dark.svg',
  wordmark: '/brand/leftside-wordmark-horizontal-dark.png',
};

const sizes = {
  sm: { mark: 'h-8 w-8', wordmark: 'h-7' },
  md: { mark: 'h-10 w-10', wordmark: 'h-9' },
  lg: { mark: 'h-12 w-12', wordmark: 'h-11' },
};

/**
 * @param {'mark' | 'wordmark'} variant
 * @param {'sm' | 'md' | 'lg'} size
 */
export default function LeftSideLogo({
  variant = 'wordmark',
  size = 'md',
  className = '',
  priority = false,
}) {
  const dim = sizes[size] || sizes.md;

  if (variant === 'mark') {
    return (
      <img
        src={ASSETS.mark}
        alt="LeftSideDev"
        className={`${dim.mark} shrink-0 rounded-[14px] object-contain ${className}`.trim()}
        width={48}
        height={48}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' } : {})}
      />
    );
  }

  return (
    <img
      src={ASSETS.wordmark}
      alt="LeftSideDev"
      className={`${dim.wordmark} w-auto max-w-[min(100%,240px)] object-contain object-left ${className}`.trim()}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' } : {})}
    />
  );
}

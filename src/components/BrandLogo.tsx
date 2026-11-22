interface BrandLogoProps {
  variant?: 'dark' | 'light';
  compact?: boolean;
}

export function BrandLogo({ variant = 'light', compact = false }: BrandLogoProps) {
  const isLight = variant === 'light';

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0 select-none">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          isLight ? 'bg-[#B8F0D1] text-[#102D27]' : 'bg-[#102D27] text-[#B8F0D1]'
        }`}
        aria-hidden="true"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.5 10.5C8.60457 10.5 9.5 9.38071 9.5 8C9.5 6.61929 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.61929 5.5 8C5.5 9.38071 6.39543 10.5 7.5 10.5Z"
            fill="currentColor"
          />
          <path
            d="M16.5 10.5C17.6046 10.5 18.5 9.38071 18.5 8C18.5 6.61929 17.6046 5.5 16.5 5.5C15.3954 5.5 14.5 6.61929 14.5 8C14.5 9.38071 15.3954 10.5 16.5 10.5Z"
            fill="currentColor"
          />
          <path
            d="M12 9C13.1046 9 14 7.88071 14 6.5C14 5.11929 13.1046 4 12 4C10.8954 4 10 5.11929 10 6.5C10 7.88071 10.8954 9 12 9Z"
            fill="currentColor"
          />
          <path
            d="M12 11.5C9.2 11.5 7 13.7 7 16.2C7 18.1 8.4 19.5 10.3 19.5C11.1 19.5 11.6 19.2 12 19.2C12.4 19.2 12.9 19.5 13.7 19.5C15.6 19.5 17 18.1 17 16.2C17 13.7 14.8 11.5 12 11.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
      {!compact && (
        <span
          className={`font-display text-lg font-bold tracking-tight whitespace-nowrap ${
            isLight ? 'text-white' : 'text-[#102D27]'
          }`}
        >
          PETFLOW
        </span>
      )}
    </div>
  );
}

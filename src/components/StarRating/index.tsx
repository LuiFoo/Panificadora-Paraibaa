"use client";

interface StarRatingProps {
  rating: number; // Nota de 0 a 5
  total?: number; // Total de avaliações
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  total = 0, 
  size = "md", 
  showNumber = true,
  interactive = false,
  onRate
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const renderStar = (index: number) => {
    const fillPercentage = Math.max(0, Math.min(1, rating - index));
    const isInteractive = interactive && onRate;

    return (
      <div
        key={index}
        className={`relative ${isInteractive ? 'cursor-pointer' : ''}`}
        onClick={() => isInteractive && onRate?.(index + 1)}
      >
        {/* Estrela vazia (fundo) */}
        <svg
          className={`${sizeClasses[size]} text-gray-300`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>

        {/* Estrela preenchida (por cima) */}
        {fillPercentage > 0 && (
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: `${fillPercentage * 100}%` }}
          >
            <svg
              className={`${sizeClasses[size]} text-yellow-400`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  if (rating === 0 && total === 0) {
    return (
      <div className={`flex items-center gap-1 ${textSizeClasses[size]} text-gray-400`}>
        {[...Array(5)].map((_, i) => renderStar(i))}
        <span className="ml-1">Sem avaliações</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => renderStar(i))}
      </div>
      {showNumber && (
        <span className={`${textSizeClasses[size]} font-semibold text-gray-700 ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
      {total > 0 && (
        <span className={`${textSizeClasses[size]} text-gray-500`}>
          ({total})
        </span>
      )}
    </div>
  );
}


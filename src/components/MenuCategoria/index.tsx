"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Interface for category menu props
interface CategoryNavProps {
  categories: string[];
  activeCategory?: string | null;
  variant?: "button" | "link";
  onCategoryClick?: (category: string) => void;
}

function MenuCategoria({
  categories,
  activeCategory = null,
  variant = "button",
  onCategoryClick
}: CategoryNavProps) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (containerRef) {
      const isOverflow = containerRef.scrollWidth > containerRef.clientWidth;
      setIsOverflowing(isOverflow);
    }
  }, [containerRef, categories]);

  const handleItemClick = (category: string) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <div className="relative">
      {/* Scrollbar styling para webkit browsers */}
      <style jsx>{`
        nav::-webkit-scrollbar {
          height: 8px;
        }
        nav::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        nav::-webkit-scrollbar-thumb {
          background: var(--color-avocado-600);
          border-radius: 10px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: var(--color-avocado-700);
        }
      `}</style>
      
      <nav 
        className={`flex ${isOverflowing ? 'overflow-x-auto scrollbar-hide' : 'justify-center'} scroll-smooth`}
        ref={setContainerRef}
      >
        <ul className="flex gap-3 md:gap-4 whitespace-nowrap px-4 py-2">
          {categories.map((category, index) => {
            const isActive = activeCategory === category;
            const commonClasses = `
              block px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105
              ${isActive
                ? 'bg-gradient-to-r from-[var(--color-avocado-600)] to-[var(--color-avocado-500)] text-white shadow-lg scale-105'
                : 'bg-white text-[var(--color-avocado-600)] hover:shadow-xl border-2 border-[var(--color-avocado-600)] hover:border-[var(--color-avocado-500)]'
              }
              focus:outline-none focus:ring-2 focus:ring-[var(--color-avocado-500)] focus:ring-offset-2
            `;

            return (
              <li key={index} className="flex-shrink-0">
                {variant === "button" ? (
                  <button
                    onClick={() => handleItemClick(category)}
                    className={commonClasses}
                  >
                    {category}
                  </button>
                ) : (
                  <Link
                    href={`/produtos?categoria=${encodeURIComponent(category)}`}
                    className={commonClasses}
                  >
                    {category}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default MenuCategoria;

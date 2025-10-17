"use client";

import { useRouter } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
  color?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function BreadcrumbNav({ items, className = "" }: BreadcrumbNavProps) {
  const router = useRouter();

  const getColorClasses = (color: string = "blue") => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
      green: "bg-green-100 text-green-700 hover:bg-green-200", 
      purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
      orange: "bg-orange-100 text-orange-700 hover:bg-orange-200",
      gray: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      red: "bg-red-100 text-red-700 hover:bg-red-200"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className={`mb-8 ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex items-center space-x-2 text-sm flex-wrap gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {item.href ? (
                <button
                  onClick={() => router.push(item.href!)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${getColorClasses(item.color)}`}
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </button>
              ) : (
                <span className={`px-3 py-1 rounded-full font-medium ${getColorClasses(item.color)}`}>
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

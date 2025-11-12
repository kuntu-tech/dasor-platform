"use client";

import React from "react";
import { Eye } from "lucide-react";

interface GlassmorphismSidebarProps {
  title: string;
  items: Array<{
    id: string;
    text: string;
    icon?: React.ReactNode;
  }>;
  selectedId?: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

export function GlassmorphismSidebar({
  title,
  items,
  selectedId,
  onItemClick,
  className = "",
}: GlassmorphismSidebarProps) {
  return (
    <aside
      className={`glass-effect w-64 flex-shrink-0 flex flex-col z-10 ${className}`}
    >
      <div className="h-20 flex items-center justify-center border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-800">{title}</span>
        </div>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={`nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 transition-all duration-200 w-full text-left ${
                isSelected
                  ? "bg-white/80 shadow-md border border-gray-200/50 text-gray-900"
                  : "hover:bg-white/50 hover:shadow-sm"
              }`}
            >
              {item.icon || (
                <Eye className="w-4 h-4 flex-shrink-0 text-gray-500" />
              )}
              <span className="text-sm font-medium truncate">{item.text}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}


import React from 'react';
import { CommandIcon } from 'lucide-react';
interface FloatingCommandButtonProps {
  onClick: () => void;
}
export function FloatingCommandButton({
  onClick
}: FloatingCommandButtonProps) {
  return <button onClick={onClick} className="fixed top-1/2 -translate-y-1/2 right-8 z-40 p-4 bg-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer" aria-label="Open command palette">
      <CommandIcon className="w-6 h-6 text-white" />
    </button>;
}
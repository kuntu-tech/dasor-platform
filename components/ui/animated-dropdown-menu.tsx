"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type AnimatedDropdownMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
  }[];
  children: React.ReactNode;
};

export const AnimatedDropdownMenu = ({
  options,
  children,
}: AnimatedDropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={toggleDropdown}
        className="px-4 py-2 bg-transparent hover:bg-transparent shadow-none border-none rounded-xl backdrop-blur-sm"
      >
        {children ?? "Menu"}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 5, scale: 0.95, filter: "blur(10px)" }}
            animate={{ y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ y: 5, scale: 0.95, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "circInOut", type: "spring" }}
            className="absolute bottom-full z-[60] w-[276px] mb-2 p-1 bg-white rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm flex flex-col gap-2 border border-gray-200"
          >
            {options && options.length > 0 ? (
              options.map((option, index) => (
                <motion.button
                  key={option.label}
                  initial={{
                    opacity: 0,
                    x: 10,
                    scale: 0.95,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    x: 10,
                    scale: 0.95,
                    filter: "blur(10px)",
                  }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: "easeInOut",
                    type: "spring",
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: {
                      duration: 0.2,
                      ease: "easeInOut",
                    },
                  }}
                  whileTap={{
                    scale: 0.95,
                    transition: {
                      duration: 0.2,
                      ease: "easeInOut",
                    },
                  }}
                  onClick={() => {
                    option.onClick();
                    setIsOpen(false);
                  }}
                  className="px-2 py-2 cursor-pointer text-gray-900 text-sm rounded-lg w-full text-left flex items-center gap-x-2 hover:bg-gray-100 transition-colors"
                >
                  {option.Icon}
                  {option.label}
                </motion.button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-xs">No options</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


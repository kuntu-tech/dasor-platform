import { cn } from "@/lib/utils";

type LoaderType = "circle" | "triangle" | "rect";

interface Loader2Props {
  type?: LoaderType;
  className?: string;
  size?: number;
}

export const Loader2 = ({ 
  type = "circle", 
  className,
  size = 80 
}: Loader2Props) => {
  return (
    <div className={cn("loader", className)} style={{ width: size, height: size }}>
      {type === "circle" && (
        <svg viewBox="0 0 80 80">
          <circle r="32" cy="40" cx="40" id="test"></circle>
        </svg>
      )}
      {type === "triangle" && (
        <svg viewBox="0 0 86 80">
          <polygon points="43 8 79 72 7 72"></polygon>
        </svg>
      )}
      {type === "rect" && (
        <svg viewBox="0 0 80 80">
          <rect height="64" width="64" y="8" x="8"></rect>
        </svg>
      )}
    </div>
  );
};

// Icon version for use as an icon component (like lucide-react icons)
export const Loader2Icon = ({ className }: { className?: string }) => {
  // Extract size from className if present (e.g., "size-5" -> 20px)
  const sizeMatch = className?.match(/size-(\d+)/);
  const size = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 20; // size-5 = 20px
  
  return (
    <Loader2 type="circle" size={size} className={className} />
  );
};


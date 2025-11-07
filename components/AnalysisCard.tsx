"use client";
import React, { useState, useRef, useLayoutEffect } from "react";
interface AnalysisCardProps {
  analysis: {
    id: string;
    dimensionName: string;
    score: number;
    summary: string;
    tags: string[];
  };
  onClick: () => void;
}
export function AnalysisCard({ analysis, onClick }: AnalysisCardProps) {
  const { dimensionName, score, summary, tags, id } = analysis;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  // Calculate circle progress
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 10) * circumference;
  // Determine color based on score
  const getScoreColor = (score: number) => {
    // All four cards use unified green brand color
    if (id === "D1" || id === "D2" || id === "D3" || id === "D4")
      return "#4D7327";
    if (score >= 8.5) return "#8F56BE";
    if (score >= 7.0) return "#8F56BE";
    return "#c57d56";
  };
  const getStrokeColor = (score: number) => {
    // All four cards use unified green brand color
    if (id === "D1" || id === "D2" || id === "D3" || id === "D4")
      return "#4D7327";
    if (score >= 9.0) return "#8F56BE";
    if (score >= 8.5) return "#8F56BE";
    if (score >= 7.0) return "#8F56BE";
    return "#c57d56";
  };
  // Get label based on card ID
  const getLabel = (id: string) => {
    switch (id) {
      case "D1":
        return "Huge Potential";
      case "D2":
        return "Clear Profile";
      case "D3":
        return "Strong Moat";
      case "D4":
        return "Low Retention";
      default:
        return "";
    }
  };
  // Function to highlight specific numbers with larger font
  const formatSummary = (text: string) => {
    return text
      .replace(/\$2\.4B/g, '<span class="text-3xl font-bold">$2.4B</span>')
      .replace(/23%/g, '<span class="text-3xl font-bold">23%</span>')
      .replace(/5\.2x/g, '<span class="text-5xl font-bold">5.2x</span>');
  };

  // Check if content is truncated
  useLayoutEffect(() => {
    if (summaryRef.current) {
      const element = summaryRef.current;
      if (!isExpanded) {
        // Create a temporary element to measure full height
        const tempElement = document.createElement("p");
        tempElement.className = "text-gray-600 leading-relaxed";
        tempElement.innerHTML = formatSummary(summary);
        tempElement.style.position = "absolute";
        tempElement.style.visibility = "hidden";
        tempElement.style.width = element.offsetWidth + "px";
        tempElement.style.padding = "0";
        tempElement.style.margin = "0";
        tempElement.style.top = "-9999px";
        document.body.appendChild(tempElement);
        const fullHeight = tempElement.scrollHeight;
        document.body.removeChild(tempElement);

        const clampedHeight = element.clientHeight;
        // Check if content is actually truncated (with buffer for rounding errors)
        const isTruncated = fullHeight > clampedHeight + 5;
        setShowExpandButton(isTruncated);
      } else {
        // When expanded, always show collapse button if content exists
        setShowExpandButton(summary.trim().length > 0);
      }
    }
  }, [summary, isExpanded]);
  return (
    <article className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Dimension Name - Moved to top */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-semibold text-gray-600">
          {dimensionName}
        </h2>
      </div>
      {/* Circular Progress Score with Label */}
      <div className="flex items-center justify-start gap-6 mb-6">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90" aria-hidden="true">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="6"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke={getStrokeColor(score)}
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-baseline gap-0.5">
              <span
                className="text-4xl font-semibold"
                style={{
                  color: getScoreColor(score),
                }}
                aria-hidden="true"
              >
                {score}
              </span>
            </div>
          </div>
        </div>
        <div
          className="text-2xl font-semibold"
          style={{
            color: getScoreColor(score),
          }}
        >
          {getLabel(id)}
        </div>
      </div>
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
      {/* Summary */}
      <div className="relative">
        <p
          ref={summaryRef}
          className={`text-gray-600 leading-relaxed ${
            isExpanded ? "" : "line-clamp-3"
          }`}
          dangerouslySetInnerHTML={{
            __html: formatSummary(summary),
          }}
        />
        {showExpandButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700 font-medium inline-flex items-center gap-1 transition-colors"
            type="button"
          >
            {isExpanded ? (
              <>
                <span>collapse</span>
                <span className="text-xs">▲</span>
              </>
            ) : (
              <>
                <span>expand</span>
                <span className="text-xs">▼</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

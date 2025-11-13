import React from 'react';
interface Question {
  id: string;
  text: string;
  tags: string[];
  status: 'success' | 'warning' | 'error' | 'info';
}
interface QuestionAccordionProps {
  question: Question;
  index: number;
}
export function QuestionAccordion({
  question,
  index
}: QuestionAccordionProps) {
  return <div className="bg-white rounded-xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
      <div className="px-4 py-2 flex items-center gap-3">
        {/* Number Prefix */}
        <div className="flex-shrink-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
          backgroundColor: '#6B7280'
        }}>
            <span className="text-white font-semibold text-sm">{index}</span>
          </div>
        </div>
        {/* Question Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-base font-medium text-gray-600 mb-1 break-words">
            {question.text}
          </p>
        </div>
      </div>
    </div>;
}
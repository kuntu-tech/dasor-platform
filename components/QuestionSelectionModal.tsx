import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon, Search } from "lucide-react";

export interface QuestionOption {
  id: string;
  text: string;
  tags?: string[];
}

interface QuestionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (question: QuestionOption) => void;
  commandText?: string;
  questions?: QuestionOption[];
  segmentName?: string;
  defaultSelectedQuestionId?: string;
  onCancel?: () => void;
}

export function QuestionSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  commandText = "delete question",
  questions = [],
  segmentName,
  defaultSelectedQuestionId,
  onCancel,
}: QuestionSelectionModalProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedQuestionId(defaultSelectedQuestionId ?? "");
      setSearch("");
    }
  }, [isOpen, defaultSelectedQuestionId]);

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) {
      return questions;
    }
    const keyword = search.trim().toLowerCase();
    return questions.filter((question) => {
      const text = question.text?.toLowerCase() ?? "";
      const tagMatch = question.tags?.some((tag) =>
        tag.toLowerCase().includes(keyword)
      );
      return text.includes(keyword) || tagMatch;
    });
  }, [questions, search]);

  const handleConfirm = () => {
    const selected = filteredQuestions.find(
      (question) => question.id === selectedQuestionId
    );
    if (selected) {
      onConfirm(selected);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const hasQuestions = filteredQuestions.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[120]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 z-[130] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Select a question to{" "}
                  {commandText === "edit question" ? "edit" : "delete"}
                </h2>
                {segmentName && (
                  <p className="text-sm text-gray-500 mt-1">
                    Segment: {segmentName}
                  </p>
                )}
              </div>
              <button
                onClick={handleCancel}
                className="rounded-full p-2 transition-colors hover:bg-gray-100 cursor-pointer"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="px-6 pt-4 pb-6">
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search questions or tags..."
                  className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="max-h-96 overflow-y-auto pr-2">
                {hasQuestions ? (
                  <div className="space-y-2">
                    {filteredQuestions.map((question) => {
                      const isActive = question.id === selectedQuestionId;
                      return (
                        <button
                          key={question.id}
                          onClick={() => setSelectedQuestionId(question.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                            isActive
                              ? "border-gray-900 bg-gray-900/5"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-base font-medium text-gray-900">
                              {question.text}
                            </span>
                            {isActive && (
                              <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          {question.tags && question.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {question.tags.map((tag) => (
                                <span
                                  key={`${question.id}-${tag}`}
                                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                    {search ? (
                      <>
                        <p>No matching questions found</p>
                        <p className="text-xs text-gray-400">
                          Try different keywords or clear the filters
                        </p>
                      </>
                    ) : (
                      <>
                        <p>No actionable questions in this segment</p>
                        <p className="text-xs text-gray-400">
                          Please choose another segment or verify the data
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedQuestionId}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-900 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {commandText === "edit question" ? "Choose Question" : "Confirm Delete"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



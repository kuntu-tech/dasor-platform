import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, Check } from 'lucide-react';
interface SegmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'select' | 'input' | 'multiSelect';
  commandText: string;
  onConfirm: (value: string | string[]) => void;
  segments?: string[];
  defaultSelectedSegment?: string;
  defaultSelectedSegments?: string[];
  onCancel?: () => void;
}
export function SegmentSelectionModal({
  isOpen,
  onClose,
  mode,
  commandText,
  onConfirm,
  segments: segmentsProp,
  defaultSelectedSegment,
  defaultSelectedSegments,
  onCancel
}: SegmentSelectionModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setSelectedSegment(defaultSelectedSegment ?? '');
      setSelectedSegments(defaultSelectedSegments ?? []);
    }
  }, [isOpen, defaultSelectedSegment, defaultSelectedSegments]);
  const segments = Array.isArray(segmentsProp) ? segmentsProp : [];
  
  const toggleSegmentSelection = (segment: string) => {
    if (selectedSegments.includes(segment)) {
      setSelectedSegments(selectedSegments.filter(s => s !== segment));
    } else {
      setSelectedSegments([...selectedSegments, segment]);
    }
  };
  
  const handleConfirm = () => {
    if (mode === 'multiSelect' && selectedSegments.length > 0) {
      onConfirm(selectedSegments);
    } else if (mode === 'select' && selectedSegment) {
      onConfirm(selectedSegment);
    } else if (mode === 'input' && inputValue.trim()) {
      onConfirm(inputValue);
    }
  };
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
          {/* Modal */}
          <motion.div initial={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} transition={{
        duration: 0.2
      }} className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'multiSelect' ? 'Select Segments to Merge' : mode === 'select' ? 'Select Segment' : 'Add New Segment'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close modal">
                <XIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-4 flex flex-col flex-1 min-h-0 overflow-hidden">
              <p className="text-gray-600 mb-4 flex-shrink-0 text-sm">
                {mode === 'multiSelect' 
                  ? `Select multiple segments to merge (${selectedSegments.length} selected):`
                  : mode === 'select' 
                  ? 'Choose a segment to use for this command:' 
                  : 'Enter a name for the new segment:'}
              </p>
              {mode === 'multiSelect' ? (
                <div className="space-y-2 flex-1 overflow-y-auto pr-2 min-h-0 max-h-[50vh]">
                  {segments.length > 0 ? (
                    segments.map((segment) => {
                      const isSelected = selectedSegments.includes(segment);
                      return (
                        <button
                          key={segment}
                          onClick={() => toggleSegmentSelection(segment)}
                          className={`w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 ${
                            isSelected
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="flex-1">{segment}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                      No segments available. Please load segments first.
                    </div>
                  )}
                </div>
              ) : mode === 'select' ? (
                <div className="space-y-2 flex-1 overflow-y-auto pr-2 min-h-0 max-h-[50vh]">
                  {segments.length > 0 ? (
                    segments.map((segment) => (
                      <button
                        key={segment}
                        onClick={() => setSelectedSegment(segment)}
                        className={`w-full p-3 text-left rounded-lg transition-colors ${
                          selectedSegment === segment
                            ? 'bg-gray-100 border-2 border-gray-300'
                            : 'hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {segment}
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                      No segments available. Please load segments first.
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter segment name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                  autoFocus
                />
              )}
              <div className="flex justify-end gap-3 flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
                <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm} 
                  disabled={
                    mode === 'multiSelect' 
                      ? selectedSegments.length < 2 
                      : mode === 'select' 
                      ? !selectedSegment 
                      : !inputValue.trim()
                  } 
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mode === 'multiSelect' 
                    ? `Merge ${selectedSegments.length} Segments`
                    : commandText === 'clipboard' || commandText === 'correct segment' || commandText === 'edit d1' || commandText === 'edit d2' || commandText === 'edit d3' || commandText === 'edit d4' || commandText === 'add question' 
                    ? 'Use Segment' 
                    : 'Create Segment'}
                </button>
              </div>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}
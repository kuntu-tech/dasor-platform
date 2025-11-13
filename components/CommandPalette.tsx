import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparklesIcon } from 'lucide-react';
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandSelect: (command: string) => void;
  onSpecialCommand?: (command: 'Correct Segment' | 'add-segment') => void;
}
export function CommandPalette({
  isOpen,
  onClose,
  onCommandSelect,
  onSpecialCommand
}: CommandPaletteProps) {
  const [searchValue, setSearchValue] = useState('');
  const suggestions = [{
    icon: 'https://img.icons8.com/fluency/48/check.png',
    title: 'Correct Segment',
    subtitle: 'Update segment settings',
    action: 'Command',
    command: 'Correct Segment',
    isSpecial: true
  }, {
    icon: 'https://img.icons8.com/fluency/48/add.png',
    title: 'Add segments',
    subtitle: 'Create new segment',
    action: 'Command',
    command: 'add segment',
    isSpecial: true
  }, {
    icon: 'https://img.icons8.com/fluency/48/merge.png',
    title: 'Merge segments',
    subtitle: 'Combine multiple segments',
    action: 'Command',
    command: 'merge segments'
  }, {
    icon: 'https://img.icons8.com/fluency/48/delete.png',
    title: 'Delete segments',
    subtitle: 'Remove multiple segments',
    action: 'Command',
    command: 'delete segments'
  }, {
    icon: 'https://img.icons8.com/fluency/48/market.png',
    title: 'Adjust market size.',
    subtitle: 'Update D1 dimension',
    action: 'Command',
    command: 'edit d1'
  }, {
    icon: 'https://img.icons8.com/fluency/48/user.png',
    title: 'Adjust persona',
    subtitle: 'Update D2 dimension',
    action: 'Command',
    command: 'edit d2'
  }, {
    icon: 'https://img.icons8.com/fluency/48/conversion.png',
    title: 'Adjust conversion rhythm',
    subtitle: 'Update D3 dimension',
    action: 'Command',
    command: 'edit d3'
  }, {
    icon: 'https://img.icons8.com/fluency/48/shield.png',
    title: 'Adjust competitive moat',
    subtitle: 'Update D4 dimension',
    action: 'Command',
    command: 'edit d4'
  }, {
    icon: 'https://img.icons8.com/fluency/48/plus.png',
    title: 'Add value questions',
    subtitle: 'Create new question',
    action: 'Command',
    command: 'add question'
  }, {
    icon: 'https://img.icons8.com/fluency/48/delete.png',
    title: 'Delete value question',
    subtitle: 'Remove question',
    action: 'Command',
    command: 'delete question'
  }, {
    icon: 'https://img.icons8.com/fluency/48/edit.png',
    title: 'Adjust value question',
    subtitle: 'Modify question',
    action: 'Command',
    command: 'edit question'
  }, {
    icon: 'https://img.icons8.com/fluency/48/rename.png',
    title: 'Rename segment',
    subtitle: 'Change segment name',
    action: 'Command',
    command: 'change segment'
  }];
  const commands = [{
    icon: 'https://img.icons8.com/fluency/48/chrome.png',
    title: 'Ask Browser',
    subtitle: '@browser',
    action: 'AI Extension',
    command: 'edit question'
  }];
  const handleCommandClick = (command: string, isSpecial?: boolean) => {
    if (isSpecial && onSpecialCommand) {
      if (command === 'Correct Segment') {
        onSpecialCommand('Correct Segment');
      } else if (command === 'add segment') {
        onSpecialCommand('add-segment');
      }
    } else {
      onCommandSelect(command);
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
      }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]" />
          {/* Command Palette */}
          <motion.div initial={{
        opacity: 0,
        scale: 0.95,
        y: -20
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.95,
        y: -20
      }} transition={{
        duration: 0.2
      }} className="fixed top-24 left-1/2 transform -translate-x-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-[120] overflow-hidden" style={{
        maxHeight: '80vh'
      }}>
            {/* Header with Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <input type="text" placeholder="Search for apps and commands..." value={searchValue} onChange={e => setSearchValue(e.target.value)} className="flex-1 text-lg bg-transparent border-none outline-none text-gray-900 placeholder-gray-400" autoFocus />
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  Rerun
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="overflow-y-auto" style={{
          maxHeight: '60vh'
        }}>
              {/* Welcome Section */}
              <div className="p-6">
                {/* Progress Bar */}

                {/* Suggestions */}
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Suggestions
                </h3>
                <div className="space-y-2 mb-6">
                  {suggestions.map((item, index) => <button key={index} onClick={() => handleCommandClick(item.command, item.isSpecial)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={item.icon} alt={item.title} className="w-10 h-10 rounded-lg" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {item.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {item.action}
                      </span>
                    </button>)}
                </div>
                {/* Commands */}

                <div className="space-y-2">
                  {commands.map((item, index) => <button key={index} onClick={() => handleCommandClick(item.command)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={item.icon} alt={item.title} className="w-10 h-10 rounded-lg" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {item.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {item.action}
                      </span>
                    </button>)}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Open Walkthrough
                </button>
                <button className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm">
                  ⏎
                </button>
                <button className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm">
                  Actions
                </button>
                <button className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm">
                  ⌘K
                </button>
              </div>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}
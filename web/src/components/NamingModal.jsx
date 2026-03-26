import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import UiButton from './UiButton';

export default function NamingModal({ open, chickenNameHint, onConfirm, onCancel }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue(chickenNameHint || '');
    }
  }, [open, chickenNameHint]);

  const canConfirm = value.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(5,8,12,0.58)] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="overlay-panel grid w-[min(96vw,520px)] gap-[0.9rem] p-[clamp(1rem,2vw,1.5rem)]"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          >
            <h3 className="text-center text-[clamp(0.7rem,1.4vw,0.9rem)]">NAME YOUR CHICKEN</h3>
            <input
              className="w-full border-2 border-white/32 bg-[rgba(8,12,18,0.85)] p-[0.72rem] text-[clamp(0.58rem,1.1vw,0.7rem)] text-text-main outline-none focus:border-[rgba(255,225,120,0.85)] focus:shadow-[0_0_0_2px_rgba(255,205,94,0.16)]"
              type="text"
              value={value}
              maxLength={24}
              onChange={(event) => setValue(event.target.value)}
              placeholder="ENTER A NAME"
              autoFocus
            />

            <div className="flex flex-wrap justify-center gap-[0.7rem]">
              <UiButton hoverScale={1.03} onClick={onCancel}>
                CANCEL
              </UiButton>

              <UiButton
                hoverScale={1.03}
                onClick={() => onConfirm(value.trim())}
                disabled={!canConfirm}
              >
                CONFIRM
              </UiButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

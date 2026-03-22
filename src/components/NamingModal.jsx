import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

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
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="overlay-panel naming-modal"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          >
            <h3 className="naming-title">NAME YOUR CHICKEN</h3>
            <input
              className="naming-input"
              type="text"
              value={value}
              maxLength={24}
              onChange={(event) => setValue(event.target.value)}
              placeholder="ENTER A NAME"
              autoFocus
            />

            <div className="action-row">
              <motion.button
                type="button"
                className="ui-button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
              >
                CANCEL
              </motion.button>

              <motion.button
                type="button"
                className="ui-button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onConfirm(value.trim())}
                disabled={!canConfirm}
              >
                CONFIRM
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

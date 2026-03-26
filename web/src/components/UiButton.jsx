import { motion } from 'framer-motion';

export default function UiButton({
  children,
  className = '',
  hoverScale = 1.04,
  tapScale = 0.97,
  ...props
}) {
  const classes = ['ui-button', className].filter(Boolean).join(' ');

  return (
    <motion.button
      type="button"
      className={classes}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
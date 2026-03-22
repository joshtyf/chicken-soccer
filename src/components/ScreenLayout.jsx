import { motion } from 'framer-motion';

const DEFAULT_SCREEN_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.28 },
};

const DEFAULT_PANEL_MOTION = {
  initial: { scale: 0.96, y: 10 },
  animate: { scale: 1, y: 0 },
  exit: { scale: 1.01, opacity: 0 },
  transition: { type: 'spring', stiffness: 220, damping: 22 },
};

export default function ScreenLayout({
  children,
  panelClassName,
  screenMotion,
  panelMotion,
}) {
  const resolvedScreenMotion = { ...DEFAULT_SCREEN_MOTION, ...screenMotion };
  const resolvedPanelMotion = { ...DEFAULT_PANEL_MOTION, ...panelMotion };

  return (
    <motion.div
      className="flex min-h-[min(760px,calc(100vh-2rem))] w-[min(960px,calc(100vw-2rem))] items-center justify-center max-[720px]:min-h-[min(760px,calc(100vh-1rem))] max-[720px]:w-[min(960px,calc(100vw-1rem))]"
      {...resolvedScreenMotion}
    >
      <motion.div className={`overlay-panel ${panelClassName}`.trim()} {...resolvedPanelMotion}>
        {children}
      </motion.div>
    </motion.div>
  );
}
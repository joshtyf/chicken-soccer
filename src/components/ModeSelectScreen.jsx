import AnimatedTitle from './AnimatedTitle';
import ScreenLayout from './ScreenLayout';
import UiButton from './UiButton';
import { GAME_MODES } from '../data/gameModeDefs';

const titleWords = ['GAME', 'MODE'];

export default function ModeSelectScreen({ onBack, onSelectMode, chickenCount = 0 }) {
  const modes = Object.values(GAME_MODES);

  return (
    <ScreenLayout
      panelClassName="grid min-h-[min(78%,430px)] w-[min(88%,760px)] content-center gap-4 p-[clamp(1rem,2vw,2rem)] text-center max-[720px]:w-[min(94%,760px)]"
      screenMotion={{ transition: { duration: 0.3 } }}
      panelMotion={{
        initial: { scale: 0.92, y: 10 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 1.05, opacity: 0 },
        transition: { type: 'spring', stiffness: 220, damping: 20 },
      }}
    >
      <AnimatedTitle words={titleWords} ariaLabel="Game mode" delayStep={0.04} duration={0.32} />

      <p className="text-[clamp(0.58rem,1.2vw,0.75rem)] leading-[1.7] text-text-muted">
        CHOOSE A MODE BEFORE KICKOFF.
        <br />
        YOU CURRENTLY OWN {chickenCount} CHICKEN{chickenCount === 1 ? '' : 'S'}.
      </p>

      <div className="mx-auto grid w-[min(100%,680px)] gap-[0.6rem]">
        {modes.map((mode) => {
          const isLocked = chickenCount < mode.chickensPerTeam;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={isLocked}
              onClick={() => onSelectMode(mode)}
              className={[
                'mode-card w-full border-2 px-[0.8rem] py-[0.75rem] text-left',
                isLocked
                  ? 'cursor-not-allowed border-white/12 bg-[rgba(10,16,24,0.45)] text-[rgba(248,244,211,0.45)]'
                  : 'cursor-pointer border-white/22 bg-[rgba(10,16,24,0.76)] text-text-main',
              ].join(' ')}
              aria-label={`${mode.label} mode`}
            >
              <div className="flex flex-wrap items-center justify-between gap-[0.6rem]">
                <p className="text-[clamp(0.62rem,1.3vw,0.8rem)] text-text-main">{mode.label}</p>
                <p className="text-[clamp(0.48rem,0.95vw,0.58rem)] text-text-muted">
                  {mode.chickensPerTeam} CHICKEN{mode.chickensPerTeam === 1 ? '' : 'S'} / TEAM
                </p>
              </div>
              <p className="mt-[0.35rem] text-[clamp(0.46rem,0.9vw,0.56rem)] leading-[1.6] text-text-muted">
                {mode.description}
              </p>
              {isLocked && (
                <p className="mt-[0.38rem] text-[clamp(0.46rem,0.9vw,0.56rem)] text-[#ffe08b]">
                  REQUIRES {mode.chickensPerTeam} CHICKENS
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-[0.7rem]">
        <UiButton onClick={onBack}>BACK</UiButton>
      </div>
    </ScreenLayout>
  );
}

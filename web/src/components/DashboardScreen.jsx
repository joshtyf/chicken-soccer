import AnimatedTitle from './AnimatedTitle';
import ChickenList from './ChickenList';
import ScreenLayout from './ScreenLayout';
import UiButton from './UiButton';

const titleWords = ['CHICKEN', 'SOCCER'];

export default function DashboardScreen({ onStartMatch, onOpenStore, balance = 0, chickens = [] }) {

  return (
    <ScreenLayout
      panelClassName="grid min-h-[min(82%,520px)] w-[min(92%,760px)] content-center gap-4 p-[clamp(1rem,2.2vw,2rem)] text-center max-[720px]:w-[min(96%,760px)]"
      panelMotion={{
        initial: { scale: 0.95, y: 12 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 1.02, opacity: 0 },
      }}
    >
      <AnimatedTitle words={titleWords} ariaLabel="Chicken Soccer" delayStep={0.03} duration={0.28} />

      <p className="text-[clamp(0.58rem,1.2vw,0.75rem)] leading-[1.7] text-text-muted">
        VIEW YOUR CHICKENS AND THEIR STATS.
        <br />
        PICK YOUR STARTER ON THE NEXT SCREEN.
        <br />
        BALANCE: {balance} PP
      </p>

      <ChickenList
        chickens={chickens}
        title="CHICKEN COLLECTION"
        ariaLabel="Your chickens"
      />

      <div className="flex flex-wrap justify-center gap-[0.7rem]">
        <UiButton onClick={onOpenStore}>SHOP</UiButton>
        <UiButton onClick={onStartMatch}>PLAY</UiButton>
      </div>
    </ScreenLayout>
  );
}

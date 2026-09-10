import React from "react";
import { LogoTransition } from "@/components/transitions/LogoTransition";

export type PageTransitionKind = "practice-exam" | "question-bank";

type Props = {
  /** What animation to play (currently same visuals, kept for future). */
  kind: PageTransitionKind;
  /** Route destination ReactNode (the page to reveal underneath). */
  children: React.ReactNode;
  /** Called when transition completes or is skipped. */
  onDone?: () => void;
};

/**
 * Full-screen animated logo transition played when entering the practice
 * exam or the question bank.
 */
export function PageTransition1600({ children, onDone }: Props) {
  return (
    <LogoTransition durationMs={1200}>
      <TransitionDoneBridge onDone={onDone} />
      {children}
    </LogoTransition>
  );
}

function TransitionDoneBridge({ onDone }: { onDone?: () => void }) {
  React.useEffect(() => {
    const t = window.setTimeout(() => onDone?.(), 1250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

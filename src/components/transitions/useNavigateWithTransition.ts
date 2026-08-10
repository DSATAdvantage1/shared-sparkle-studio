import { useCallback } from "react";
import {
  requestTransition,
  type TransitionKind,
} from "@/routes/pageTransitionStore";

/**
 * Minimal helper: marks the next navigation as eligible for the 1600 transition.
 * The destination page consumes the flag.
 */
export function useNavigateWithTransition() {
  const triggerTransition = useCallback((kind: TransitionKind) => {
    requestTransition(kind);
  }, []);

  return { triggerTransition };
}

import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";

/**
 * Drop-in replacement for useNavigate() that wraps navigation
 * in the View Transitions API for smooth page crossfades.
 *
 * Falls back to instant navigation on browsers without support (Firefox).
 * flushSync ensures React commits the new route DOM before the
 * transition snapshots it.
 */
export function useViewTransitionNavigate() {
  const navigate = useNavigate();

  return (to: string) => {
    if (!("startViewTransition" in document)) {
      navigate(to);
      return;
    }

    (document as any).startViewTransition(() => {
      flushSync(() => navigate(to));
    });
  };
}

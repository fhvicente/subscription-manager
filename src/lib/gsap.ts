"use client";

import type React from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
gsap.defaults({ ease: "expo.out", duration: 1.1 });

// Run animations only when the user hasn't asked for reduced motion.
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, SplitText, useGSAP };

/**
 * Staggered entrance for every `[data-reveal]` inside `scope`.
 * Re-runs when `deps` change (e.g. after loading), animating only new elements.
 * Elements with `data-reveal` stay hidden (CSS) until this animates them, so
 * every page that uses the attribute must call this hook.
 */
export function useStaggerReveal(
    scope: React.RefObject<HTMLElement | null>,
    deps: unknown[] = []
) {
    useGSAP(
        () => {
            const els = scope.current?.querySelectorAll<HTMLElement>(
                "[data-reveal]:not([data-revealed])"
            );
            if (!els?.length) return;
            els.forEach((el) => el.setAttribute("data-revealed", ""));
            gsap.matchMedia().add(MOTION_OK, () => {
                gsap.from(els, { autoAlpha: 0, y: 24, stagger: 0.06, duration: 0.9 });
            });
            // Revert (unmount, incl. StrictMode's dev remount) drops the tween's
            // inline styles, so unmark too or the next run skips them and CSS keeps them hidden.
            return () => els.forEach((el) => el.removeAttribute("data-revealed"));
        },
        { scope, dependencies: deps }
    );
}

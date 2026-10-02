"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";

const WORDS = ["Streaming", "Music", "Cloud", "Gym", "News", "Software", "Delivery", "Dating", "Games", "VPN"];

export default function Marquee() {
    const root = useRef<HTMLDivElement>(null);

    // Infinite loop whose speed and direction follow scroll velocity.
    useGSAP(
        () => {
            gsap.matchMedia().add(MOTION_OK, () => {
                const loop = gsap.to(".marquee-track", {
                    xPercent: -50,
                    duration: 28,
                    ease: "none",
                    repeat: -1,
                });
                const st = ScrollTrigger.create({
                    onUpdate: (self) => {
                        const boost = gsap.utils.clamp(1, 6, Math.abs(self.getVelocity() / 300));
                        gsap.to(loop, { timeScale: self.direction * boost, duration: 0.2, overwrite: true });
                        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.2 });
                    },
                });
                return () => st.kill();
            });
        },
        { scope: root }
    );

    const row = WORDS.map((w) => (
        <span key={w} className="flex items-center gap-[0.35em]">
            {w}
            <span aria-hidden="true" className="inline-block size-[0.32em] rounded-full bg-acid" />
        </span>
    ));

    return (
        <div
            ref={root}
            aria-hidden="true"
            className="overflow-hidden border-y border-ink bg-ink py-5 text-paper"
        >
            <div className="marquee-track display flex w-max gap-[0.35em] whitespace-nowrap text-[clamp(2rem,5vw,4rem)]">
                {row}
                {row}
            </div>
        </div>
    );
}

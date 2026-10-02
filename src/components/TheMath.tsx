"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

const STEPS = [
    { value: 9.99, text: "a month doesn't sound like much." },
    { value: 119.88, text: "Twelve months later, it's this." },
    { value: 599.4, text: "Five years. For an app you stopped opening in week two." },
];

const eur = (n: number) =>
    n.toLocaleString("en-IE", { style: "currency", currency: "EUR" });

export default function TheMath() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            gsap.matchMedia().add(MOTION_OK, () => {
                const numEl = root.current!.querySelector(".math-num")!;
                const n = { v: STEPS[0].value };
                const render = () => (numEl.textContent = eur(n.v));
                render();

                const tl = gsap.timeline({
                    defaults: { ease: "none" },
                    scrollTrigger: {
                        trigger: root.current,
                        start: "top top",
                        end: "+=220%",
                        pin: true,
                        scrub: 0.6,
                    },
                });
                gsap.set(".math-step", { opacity: 0.18 });
                gsap.set(".math-step-0", { opacity: 1 });

                STEPS.slice(1).forEach((s, i) => {
                    tl.to(n, { v: s.value, duration: 1, onUpdate: render }, i * 1.2)
                        .to(`.math-step-${i}`, { opacity: 0.18, duration: 0.3 }, i * 1.2)
                        .to(`.math-step-${i + 1}`, { opacity: 1, duration: 0.3 }, i * 1.2 + 0.2);
                });
                tl.to(".math-num", { color: "var(--leak)", duration: 0.4 }, 1.6)
                    .to(".math-bar", { scaleX: 1, duration: tl.duration() }, 0);
            });
        },
        { scope: root }
    );

    return (
        <section
            id="the-math"
            ref={root}
            className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-ink px-5 py-24 text-paper sm:px-8"
        >
            <div className="mx-auto w-full max-w-7xl">
                <p className="eyebrow text-acid">The math nobody does</p>
                <p
                    className="math-num display mt-6 text-[clamp(4rem,17vw,15rem)] tabular-nums text-paper"
                    aria-live="off"
                >
                    {eur(STEPS[2].value)}
                </p>
                <ol className="mt-10 grid max-w-4xl gap-4 text-[clamp(1.25rem,2.6vw,2rem)] font-semibold leading-tight md:grid-cols-3 md:gap-8">
                    {STEPS.map((s, i) => (
                        <li key={i} className={`math-step math-step-${i}`}>
                            <span className="mb-2 block text-sm font-medium tabular-nums text-acid">
                                {eur(s.value)}
                            </span>
                            {s.text}
                        </li>
                    ))}
                </ol>
            </div>
            <div
                aria-hidden="true"
                className="math-bar absolute inset-x-0 bottom-0 h-2 origin-left scale-x-0 bg-acid motion-reduce:scale-x-100"
            />
        </section>
    );
}

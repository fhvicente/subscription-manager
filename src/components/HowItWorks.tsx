"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const STEPS = [
    {
        title: "Dump them in.",
        body: "Name, price, renewal date. Thirty seconds each, no bank login needed.",
        tone: "bg-paper-2 text-ink",
    },
    {
        title: "Get warned.",
        body: "Pick how many days ahead you want the email. We send it before every charge.",
        tone: "bg-acid text-ink",
    },
    {
        title: "Cut the dead weight.",
        body: "Cancel what you don't use, mark it in SubTrack, watch the yearly total drop.",
        tone: "bg-leak-deep text-paper",
    },
];

export default function HowItWorks() {
    const root = useRef<HTMLElement>(null);

    // Desktop: pin and scroll the panels sideways.
    useGSAP(
        () => {
            gsap.matchMedia().add(
                "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
                () => {
                    const track = root.current!.querySelector<HTMLElement>(".steps-track")!;
                    const distance = () => track.scrollWidth - window.innerWidth;
                    const tween = gsap.to(track, {
                        x: () => -distance(),
                        ease: "none",
                        scrollTrigger: {
                            trigger: root.current,
                            start: "top top",
                            end: () => `+=${distance()}`,
                            pin: true,
                            scrub: 0.8,
                            invalidateOnRefresh: true,
                        },
                    });
                    gsap.utils.toArray<HTMLElement>(".step-num").forEach((el) => {
                        gsap.from(el, {
                            yPercent: 40,
                            ease: "none",
                            scrollTrigger: {
                                trigger: el,
                                containerAnimation: tween,
                                start: "left right",
                                end: "left center",
                                scrub: true,
                            },
                        });
                    });
                }
            );
        },
        { scope: root }
    );

    return (
        <section
            id="how-it-works"
            ref={root}
            className="overflow-hidden bg-paper lg:h-svh"
        >
            <div className="steps-track flex h-full flex-col gap-4 px-5 py-24 sm:px-8 lg:w-max lg:flex-row lg:items-stretch lg:gap-6 lg:py-6">
                <div className="flex flex-col justify-end pb-6 lg:w-[34vw] lg:pb-10 lg:pr-10">
                    <p className="eyebrow text-ink-soft">How it works</p>
                    <h2 className="display mt-4 text-[clamp(2.75rem,5vw,4.75rem)]">
                        Three steps. That's it.
                    </h2>
                </div>
                {STEPS.map((s, i) => (
                    <article
                        key={s.title}
                        className={`flex flex-col justify-between overflow-hidden rounded-xl p-8 sm:p-10 lg:w-[58vw] xl:w-[48vw] ${s.tone}`}
                    >
                        <span
                            aria-hidden="true"
                            className="step-num display block text-[clamp(7rem,22vw,20rem)] leading-[0.8]"
                        >
                            {i + 1}
                        </span>
                        <div className="mt-10 max-w-md">
                            <h3 className="text-[clamp(1.75rem,3vw,2.75rem)] font-extrabold leading-none tracking-[-0.03em] font-wide">
                                <span className="sr-only">Step {i + 1}: </span>
                                {s.title}
                            </h3>
                            <p className="mt-4 text-lg leading-relaxed opacity-80">{s.body}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

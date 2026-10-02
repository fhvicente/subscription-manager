"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

function ListVignette() {
    const rows = [
        ["Music", "Oct 04", "€10.99"],
        ["Cloud storage", "Oct 11", "€2.99"],
        ["Streaming", "Oct 19", "€12.99"],
    ];
    return (
        <ul className="divide-y divide-ink/10 rounded-xl border-[1.5px] border-ink bg-card">
            {rows.map(([n, d, p]) => (
                <li key={n} className="flex items-center gap-4 px-5 py-4 text-sm">
                    <span className="w-14 tabular-nums text-ink-soft">{d}</span>
                    <span className="flex-1 font-semibold">{n}</span>
                    <span className="tabular-nums">{p}</span>
                </li>
            ))}
        </ul>
    );
}

function NudgeVignette() {
    return (
        <div className="relative">
            <div className="rotate-[-2deg] rounded-xl bg-ink p-5 text-paper">
                <p className="eyebrow text-acid">Reminder · in 3 days</p>
                <p className="mt-3 text-xl font-bold tracking-tight">
                    Music renews on Friday
                </p>
                <p className="mt-1 text-sm text-paper/70">€10.99 will leave your card.</p>
                <div className="mt-5 flex gap-2 text-sm font-semibold">
                    <span className="rounded-full bg-acid px-3 py-1.5 text-ink">Keep it</span>
                    <span className="rounded-full border border-paper/30 px-3 py-1.5">Cancel</span>
                </div>
            </div>
        </div>
    );
}

function BarsVignette() {
    const bars = [
        ["Fitness", 418.8, "w-full"],
        ["Streaming", 287.76, "w-[69%]"],
        ["News", 90, "w-[22%]"],
        ["Cloud", 35.88, "w-[9%]"],
    ] as const;
    return (
        <ul className="space-y-3">
            {bars.map(([n, v, w]) => (
                <li key={n}>
                    <div className="mb-1 flex justify-between text-sm">
                        <span className="font-semibold">{n}</span>
                        <span className="tabular-nums text-ink-soft">€{v.toFixed(2)}/yr</span>
                    </div>
                    <div className="h-4 rounded-full bg-ink/[0.07]">
                        <div className={`feature-bar h-full origin-left rounded-full bg-ink ${w}`} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

const FEATURES = [
    {
        title: "Every renewal, one list.",
        body: "Add a subscription once. SubTrack keeps the price, the cycle and the next charge date in a single place you can read in ten seconds.",
        vignette: <ListVignette />,
    },
    {
        title: "A nudge before you pay.",
        body: "An email lands days before each renewal, while cancelling is still free. You decide; we just make sure you get the chance.",
        vignette: <NudgeVignette />,
    },
    {
        title: "The real number, per year.",
        body: "Monthly prices are designed to feel small. We add them up by category so you see what each habit costs across a whole year.",
        vignette: <BarsVignette />,
    },
];

export default function Features() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            gsap.matchMedia().add(MOTION_OK, () => {
                gsap.utils.toArray<HTMLElement>(".feature").forEach((el) => {
                    const tl = gsap.timeline({
                        scrollTrigger: { trigger: el, start: "top 78%" },
                    });
                    tl.from(el.querySelector(".feature-index"), { yPercent: 60, autoAlpha: 0 })
                        .from(el.querySelectorAll(".feature-copy > *"), { y: 40, autoAlpha: 0, stagger: 0.08 }, 0.1)
                        .from(el.querySelector(".feature-vignette"), { y: 80, autoAlpha: 0, rotate: 2 }, 0.2)
                        .from(el.querySelectorAll(".feature-bar"), { scaleX: 0, stagger: 0.08, duration: 1.4 }, 0.5);
                });
            });
        },
        { scope: root }
    );

    return (
        <section id="features" ref={root} className="bg-paper px-5 py-28 sm:px-8 md:py-40">
            <div className="mx-auto max-w-7xl">
                <h2 className="display max-w-4xl text-[clamp(2.75rem,7vw,6rem)]">
                    Less tracking. <span className="text-ink-soft">More cancelling.</span>
                </h2>

                <div className="mt-24 space-y-28 md:mt-36 md:space-y-44">
                    {FEATURES.map((f, i) => (
                        <article
                            key={f.title}
                            className="feature grid items-center gap-10 md:grid-cols-12 md:gap-8"
                        >
                            <div
                                className={`feature-copy md:col-span-5 ${
                                    i % 2 ? "md:order-2 md:col-start-8" : ""
                                }`}
                            >
                                <span className="feature-index display block text-[clamp(5rem,12vw,9rem)] text-acid [-webkit-text-stroke:2px_var(--ink)]">
                                    0{i + 1}
                                </span>
                                <h3 className="mt-6 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] font-wide">
                                    {f.title}
                                </h3>
                                <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
                                    {f.body}
                                </p>
                            </div>
                            <div
                                className={`feature-vignette md:col-span-5 ${
                                    i % 2 ? "md:order-1 md:col-start-2" : "md:col-start-8"
                                }`}
                            >
                                {f.vignette}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

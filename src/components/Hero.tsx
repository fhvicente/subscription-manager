"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { gsap, SplitText, useGSAP, MOTION_OK } from "@/lib/gsap";

// Illustrative receipt, not user data.
export const RECEIPT = [
    { name: "Streaming, 4K plan", price: 12.99 },
    { name: "Music", price: 10.99 },
    { name: "Cloud storage, 200 GB", price: 2.99 },
    { name: "Gym (last visit: March)", price: 34.9 },
    { name: "Language app, 3-day streak", price: 8.99 },
    { name: "News you never open", price: 7.5 },
];
const MONTHLY = RECEIPT.reduce((t, r) => t + r.price, 0);
export const YEARLY = MONTHLY * 12;

const eur = (n: number) =>
    n.toLocaleString("en-IE", { style: "currency", currency: "EUR" });

export default function Hero() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();
            mm.add(MOTION_OK, () => {
                const split = SplitText.create(".hero-line", {
                    type: "words,chars",
                    mask: "words",
                    wordsClass: "word",
                });
                const total = { v: 0 };
                const totalEl = root.current!.querySelector(".receipt-total")!;

                const tl = gsap.timeline({ delay: 0.15 });
                tl.set(".hero-title", { autoAlpha: 1 }).from(split.chars, {
                    yPercent: 110,
                    stagger: 0.018,
                    duration: 1.2,
                })
                    .from(
                        "[data-hero-fade]",
                        { autoAlpha: 0, y: 24, stagger: 0.08 },
                        0.6
                    )
                    .from(
                        ".receipt",
                        {
                            autoAlpha: 0,
                            clipPath: "inset(0 0 100% 0)",
                            y: -40,
                            duration: 1.4,
                        },
                        0.5
                    )
                    .from(
                        ".receipt-row",
                        { autoAlpha: 0, x: -12, stagger: 0.07, duration: 0.6 },
                        0.9
                    )
                    .to(
                        total,
                        {
                            v: YEARLY,
                            duration: 1.6,
                            ease: "power3.out",
                            onUpdate: () => {
                                totalEl.textContent = eur(total.v);
                            },
                        },
                        1.2
                    );

                // The full stop drips.
                gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 2.4 })
                    .fromTo(
                        ".drip",
                        { y: 0, scaleY: 1, autoAlpha: 1 },
                        { y: "38vh", scaleY: 1.6, duration: 1.1, ease: "power2.in" }
                    )
                    .to(".drip", { autoAlpha: 0, duration: 0.15 }, "-=0.15")
                    .set(".drip", { y: 0, scaleY: 1 })
                    .to(".drip", { autoAlpha: 1, duration: 0.5, ease: "power1.out" });

                // Scroll: headline lines drift apart, receipt floats up.
                gsap.to(".hero-line-1", {
                    xPercent: -6,
                    ease: "none",
                    scrollTrigger: { trigger: root.current, start: "top top", scrub: true },
                });
                gsap.to(".hero-line-3", {
                    xPercent: 5,
                    ease: "none",
                    scrollTrigger: { trigger: root.current, start: "top top", scrub: true },
                });
                gsap.to(".receipt", {
                    yPercent: -18,
                    rotate: -2,
                    ease: "none",
                    scrollTrigger: { trigger: root.current, start: "top top", scrub: true },
                });
            });
        },
        { scope: root }
    );

    return (
        <section
            ref={root}
            className="relative overflow-hidden bg-acid text-ink"
        >
            <div className="mx-auto flex min-h-svh max-w-7xl flex-col justify-between gap-12 px-5 pb-16 pt-32 sm:px-8 lg:pb-20 lg:pt-36">
                <p data-reveal data-hero-fade className="eyebrow">
                    Subscription tracker · free to start
                </p>

                <h1 data-reveal className="hero-title display text-[clamp(3.25rem,10.4vw,9.75rem)]">
                    <span className="hero-line hero-line-1 block">Your money</span>
                    <span className="hero-line block">is quietly</span>
                    <span className="hero-line hero-line-3 relative inline-block">
                        leaking<span className="text-leak">.</span>
                        <span
                            aria-hidden="true"
                            className="drip absolute bottom-[0.08em] right-[0.06em] size-[0.17em] origin-top rounded-full bg-leak opacity-0"
                        />
                    </span>
                </h1>

                <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-6">
                    <div className="flex max-w-xl flex-col gap-8 lg:col-span-7">
                        <p
                            data-reveal
                            data-hero-fade
                            className="text-lg leading-snug font-medium sm:text-xl"
                        >
                            SubTrack puts every subscription on one list, warns you
                            before each renewal and shows what they really cost per
                            year. Then you cancel the ones you forgot.
                        </p>
                        <div
                            data-reveal
                            data-hero-fade
                            className="flex flex-wrap items-center gap-x-6 gap-y-4"
                        >
                            <Button asChild size="lg">
                                <Link href="/sign-up">Plug the leak, free</Link>
                            </Button>
                            <Button asChild variant="link" className="text-base">
                                <Link href="#the-math">Do the math first</Link>
                            </Button>
                        </div>
                    </div>

                    <figure
                        data-reveal
                        className="receipt w-full max-w-[22rem] justify-self-center rotate-[3deg] bg-paper px-6 pb-10 pt-6 font-narrow [mask:radial-gradient(10px_at_50%_100%,#0000_98%,#000)_50%_100%/20px_100%_repeat-x] lg:col-span-5 lg:-mt-48 lg:justify-self-end"
                    >
                        <figcaption className="flex items-baseline justify-between border-b-[1.5px] border-dashed border-ink/40 pb-3">
                            <span className="text-sm font-bold uppercase tracking-[0.12em]">
                                Your statement
                            </span>
                            <span className="text-xs text-ink-soft">/month</span>
                        </figcaption>
                        <ul className="space-y-2 py-4 text-[15px]">
                            {RECEIPT.map((r) => (
                                <li
                                    key={r.name}
                                    className="receipt-row flex justify-between gap-4"
                                >
                                    <span>{r.name}</span>
                                    <span className="tabular-nums">{eur(r.price)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t-[1.5px] border-dashed border-ink/40 pt-3">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-bold uppercase tracking-[0.12em]">
                                    Per year
                                </span>
                                <span className="receipt-total font-wide text-3xl font-extrabold tabular-nums tracking-tight text-leak-deep">
                                    {eur(YEARLY)}
                                </span>
                            </div>
                        </div>
                    </figure>
                </div>
            </div>
        </section>
    );
}

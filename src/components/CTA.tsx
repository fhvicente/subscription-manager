"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, SplitText, useGSAP, MOTION_OK } from "@/lib/gsap";

export default function CTA() {
    const root = useRef<HTMLElement>(null);
    const btn = useRef<HTMLAnchorElement>(null);

    useGSAP(
        () => {
            gsap.matchMedia().add(MOTION_OK, () => {
                const split = SplitText.create(".cta-title", { type: "words,chars", mask: "chars", charsClass: "char" });
                gsap.from(split.chars, {
                    yPercent: 120,
                    stagger: 0.025,
                    duration: 1.3,
                    scrollTrigger: { trigger: root.current, start: "top 65%" },
                });

                // Magnetic button (pointer devices only).
                if (!window.matchMedia("(hover: hover)").matches) return;
                const el = btn.current!;
                const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "expo.out" });
                const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "expo.out" });
                const move = (e: PointerEvent) => {
                    const r = el.getBoundingClientRect();
                    xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
                    yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
                };
                const leave = () => {
                    xTo(0);
                    yTo(0);
                };
                el.addEventListener("pointermove", move);
                el.addEventListener("pointerleave", leave);
                return () => {
                    el.removeEventListener("pointermove", move);
                    el.removeEventListener("pointerleave", leave);
                };
            });
        },
        { scope: root }
    );

    return (
        <section
            ref={root}
            className="relative overflow-hidden bg-leak-deep px-5 py-28 text-paper sm:px-8 md:py-40"
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-14 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="cta-title display text-[clamp(3.5rem,13vw,12rem)]">
                        Plug
                        <br />
                        the leak.
                    </h2>
                    <p className="mt-8 max-w-md text-lg leading-relaxed text-paper/85">
                        Free to start. No card, no bank connection. Add your first
                        subscription in under a minute.
                    </p>
                </div>
                <Link
                    ref={btn}
                    href="/sign-up"
                    className="group grid size-44 shrink-0 place-items-center self-start rounded-full bg-acid text-center text-lg font-extrabold leading-tight tracking-tight text-ink transition-colors duration-300 hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-paper focus-visible:ring-offset-4 focus-visible:ring-offset-leak-deep sm:size-56 sm:text-xl lg:self-end"
                >
                    <span>
                        Start free
                        <span aria-hidden="true" className="mt-1 block text-3xl transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1">
                            ↗
                        </span>
                    </span>
                </Link>
            </div>
        </section>
    );
}

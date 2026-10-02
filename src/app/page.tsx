"use client";

import MainLayout from "@/components/layouts/MainLayout";
import Marquee from "@/components/Marquee";
import TheMath from "@/components/TheMath";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";

export default function Home() {
    return (
        <MainLayout showHero={true}>
            <Marquee />
            <TheMath />
            <Features />
            <HowItWorks />
            <CTA />
        </MainLayout>
    );
}

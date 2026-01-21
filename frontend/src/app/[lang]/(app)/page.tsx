"use client";

import MainLayout from "@/components/layouts/MainLayout";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";

export default function Home() {
    return (
        <MainLayout showHero={true}>
            <Features />
            <HowItWorks />
            <CTA />
        </MainLayout>
    );
}

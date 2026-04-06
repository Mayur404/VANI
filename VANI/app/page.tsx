'use client'

import { useEffect, useRef } from 'react'
import type { Metadata } from 'next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '@/components/landing/Navbar'


import Hero from '@/components/landing/Hero'
import PitchStatement from '@/components/landing/PitchStatement'
import FeatureShowcase from '@/components/landing/FeatureShowcase'
import DualDomain from '@/components/landing/DualDomain'
import Stats from '@/components/landing/Stats'
import Changelog from '@/components/landing/Changelog'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'
import TranscriptMockup from '@/components/landing/ui/TranscriptMockup'
import ExtractionMockup from '@/components/landing/ui/ExtractionMockup'
import AlertMockup from '@/components/landing/ui/AlertMockup'

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
    const pageRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches

        if (prefersReducedMotion) {
            gsap.globalTimeline.timeScale(0)
            return
        }

        const ctx = gsap.context(() => {
            // Global page fade in
            gsap.fromTo(
                pageRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.5, ease: 'power2.out' }
            )
        }, pageRef)

        return () => {
            ctx.revert()
            ScrollTrigger.getAll().forEach((t) => t.kill())
        }
    }, [])

    return (
        <div ref={pageRef} className="min-h-screen">
            <Navbar />

            <main className="pt-[56px]">
                {/* Section 1 - Hero */}
                <Hero />

                {/* Section 2 - Pitch Statement */}
                <PitchStatement />

                {/* Section 3 - Feature Showcase 1: Record */}
                <FeatureShowcase
                    number="1.0"
                    label="Record →"
                    headline="Turn conversations into structured records"
                    body="Doctor speaks. Patient replies. VANI listens silently, identifies each speaker, and generates a complete medical report — ready for review."
                    subFeatures={[
                        '1.1  Live transcription',
                        '1.2  Speaker diarization',
                        '1.3  Language detection',
                        '1.4  Auto report generation',
                    ]}
                    mockup={<TranscriptMockup />}
                />

                {/* Section 4 - Feature Showcase 2: Extract (mirrored) */}
                <FeatureShowcase
                    number="2.0"
                    label="Extract →"
                    headline="Structured data from every spoken word"
                    body="Claude AI reads the full transcript and extracts medical fields in real time — chief complaint, symptoms, diagnosis, treatment plan. Editable before approval."
                    subFeatures={[
                        '2.1  Real-time extraction',
                        '2.2  Editable reports',
                        '2.3  Doctor approval workflow',
                        '2.4  JSON export',
                    ]}
                    mockup={<ExtractionMockup />}
                    mirrored
                />

                {/* Section 5 - Feature Showcase 3: Alert */}
                <FeatureShowcase
                    number="3.0"
                    label="Alert →"
                    headline="3-way critical alerts. Zero delay."
                    body="When VANI detects a critical symptom, it notifies the doctor, patient, and emergency contact simultaneously — in under 2 seconds."
                    subFeatures={[
                        '3.1  Doctor push notification',
                        '3.2  Patient SMS',
                        '3.3  Emergency contact alert',
                        '3.4  Sentiment analysis',
                    ]}
                    mockup={<AlertMockup />}
                />

                {/* Section 6 - Dual Domain */}
                <DualDomain />

                {/* Section 7 - Stats */}
                <Stats />

                {/* Section 8 - Changelog */}
                <Changelog />

                {/* Section 9 - CTA */}
                <CTA />
            </main>

            <Footer />
        </div>
    )
}

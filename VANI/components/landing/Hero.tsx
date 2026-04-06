'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ProductMockup from './ui/ProductMockup'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
    const heroRef = useRef<HTMLDivElement>(null)
    const headlineRef = useRef<HTMLHeadingElement>(null)
    const subtextRef = useRef<HTMLParagraphElement>(null)
    const ctaRef = useRef<HTMLDivElement>(null)
    const badgeRef = useRef<HTMLDivElement>(null)
    const mockupRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Headline animation - split by words manually
            const headline = headlineRef.current
            if (headline) {
                const words = headline.textContent?.split(' ') || []
                headline.innerHTML = ''
                words.forEach((word, i) => {
                    const span = document.createElement('span')
                    span.textContent = word + ' '
                    span.style.display = 'inline-block'
                    span.style.opacity = '0'
                    span.style.transform = 'translateY(40px)'
                    headline.appendChild(span)
                })

                gsap.to(headline.children, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.06,
                    ease: 'power3.out',
                    delay: 0.2,
                })
            }

            // Subtext fade in
            gsap.fromTo(subtextRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 }
            )

            // CTA buttons fade in
            gsap.fromTo(ctaRef.current?.children,
                { opacity: 0, y: 16 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    delay: 0.8,
                }
            )

            // Badge fade in
            gsap.fromTo(badgeRef.current,
                { opacity: 0, scale: 0.95 },
                { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', delay: 1.0 }
            )

            // Product mockup slide up
            gsap.fromTo(mockupRef.current,
                { y: 60, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power3.out',
                    delay: 1.2,
                    scrollTrigger: {
                        trigger: mockupRef.current,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    },
                }
            )
        }, heroRef)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={heroRef} className="pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Hero Content */}
                <div className="mb-12">
                    <h1
                        ref={headlineRef}
                        className="font-oxanium font-extrabold text-white leading-[1.1] mb-6"
                        style={{ fontSize: 'clamp(48px, 7vw, 96px)' }}
                    >
                        The  voice intelligence system for healthcare and finance
                    </h1>

                    <p
                        ref={subtextRef}
                        className="font-lexend font-light text-[#8B8B8B] max-w-2xl text-lg mb-8"
                    >
                        Purpose-built for recording, transcribing, and understanding spoken
                        interactions. Designed for multilingual India.
                    </p>

                    {/* CTAs */}
                    <div ref={ctaRef} className="flex items-center gap-6 mb-6">
                        <a
                            href="/sign-up"
                            className="inline-flex items-center bg-white text-[#0A0A0A] font-medium px-6 py-3 rounded-full hover:scale-[1.02] transition-transform duration-200"
                        >
                            Get started
                        </a>
                        <a
                            href="#how-it-works"
                            className="inline-flex items-center gap-1.5 text-[#8B8B8B] hover:text-white transition-colors duration-200"
                        >
                            See how it works
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </a>
                    </div>

                    {/* Announcement badge */}
                    <div
                        ref={badgeRef}
                        className="inline-flex items-center gap-2 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1.5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        <span className="text-xs text-[#8B8B8B] font-medium">
                            Kannada + Hindi + English supported
                        </span>
                    </div>
                </div>

                {/* Product UI Mockup */}
                <div ref={mockupRef}>
                    <ProductMockup />
                </div>

                {/* Language ticker */}
                <div className="mt-16 overflow-hidden">
                    <div className="flex animate-marquee">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 pr-3">
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    Kannada
                                </span>
                                <span className="text-[#444444]">·</span>
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    Hindi
                                </span>
                                <span className="text-[#444444]">·</span>
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    English
                                </span>
                                <span className="text-[#444444]">·</span>
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    Telugu
                                </span>
                                <span className="text-[#444444]">·</span>
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    Marathi
                                </span>
                                <span className="text-[#444444]">·</span>
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    Tamil
                                </span>
                                <span className="text-[#444444]">·</span>
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    Bengali
                                </span>
                                <span className="text-[#444444]">·</span>
                                <span className="text-[11px] font-outfit text-[#444444] uppercase tracking-widest">
                                    Gujarati
                                </span>
                                <span className="text-[#444444]">·</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
        </section>
    )
}

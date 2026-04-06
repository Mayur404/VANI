'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface FeatureShowcaseProps {
  number: string
  label: string
  headline: string
  body: string
  subFeatures: string[]
  mockup: React.ReactNode
  mirrored?: boolean
}

gsap.registerPlugin(ScrollTrigger)

export default function FeatureShowcase({
  number,
  label,
  headline,
  body,
  subFeatures,
  mockup,
  mirrored = false,
}: FeatureShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Text content animation
      tl.fromTo(
        textRef.current?.querySelectorAll('.animate-in'),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        }
      )

      // Mockup animation
      tl.fromTo(
        mockupRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
        },
        '-=0.4'
      )

      // Sub-features stagger
      tl.fromTo(
        textRef.current?.querySelectorAll('.sub-feature'),
        { opacity: 0, x: mirrored ? 20 : -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
        },
        '-=0.6'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [mirrored])

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-12 items-start ${mirrored ? 'direction-rtl' : ''}`}>
          {/* Left Column - Text */}
          <div
            ref={textRef}
            className={`space-y-8 ${mirrored ? 'md:order-2' : 'md:order-1'}`}
          >
            <div className="animate-in">
              <span className="font-mono text-[#444444] text-sm">{number}</span>
              <span className="font-mono text-[#8B8B8B] text-sm ml-2">{label}</span>
            </div>

            <h2
              className="animate-in font-oxanium font-extrabold text-white leading-[1.15]"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
            >
              {headline}
            </h2>

            <p className="animate-in font-lexend font-light text-[#8B8B8B] text-base leading-relaxed max-w-md">
              {body}
            </p>

            {/* Sub-features */}
            <div className="space-y-3 pt-4">
              {subFeatures.map((feature, i) => (
                <div
                  key={i}
                  className="sub-feature flex items-center gap-2 group cursor-pointer"
                >
                  <span className="font-mono text-[#444444] text-xs">{feature.split('  ')[0]}</span>
                  <span className="font-lexend text-[#8B8B8B] text-sm group-hover:text-white transition-colors">
                    {feature.split('  ')[1] || feature}
                  </span>
                  <span className="text-[#444444] group-hover:text-white transition-colors">+</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Mockup */}
          <div
            ref={mockupRef}
            className={`sticky top-24 ${mirrored ? 'md:order-1' : 'md:order-2'}`}
          >
            {mockup}
          </div>
        </div>
      </div>
    </section>
  )
}

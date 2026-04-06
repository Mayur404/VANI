'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Headline line 1
      tl.fromTo(
        '.cta-line-1',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
        }
      )

      // Headline line 2
      tl.fromTo(
        '.cta-line-2',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
        },
        '-=0.7'
      )

      // Buttons
      tl.fromTo(
        '.cta-buttons',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
        },
        '-=0.5'
      )

      // Footer text
      tl.fromTo(
        '.cta-footer',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.3'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-32 px-6">
      <div className="max-w-7xl mx-auto text-center">
        {/* Headline */}
        <h2
          className="font-oxanium font-extrabold text-white mb-10"
          style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}
        >
          <span className="cta-line-1 block">Built for the future.</span>
          <span className="cta-line-2 text-[#8B8B8B] block mt-2">
            Available today.
          </span>
        </h2>

        {/* Buttons */}
        <div className="cta-buttons flex items-center justify-center gap-6 mb-8">
          <a
            href="/sign-up"
            className="inline-flex items-center bg-white text-[#0A0A0A] font-medium px-8 py-3.5 rounded-full hover:scale-[1.02] transition-transform duration-200"
          >
            Get started
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 text-[#8B8B8B] hover:text-white transition-colors duration-200"
          >
            Contact us
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>

        {/* Footer text */}
        <div className="cta-footer">
          <p className="font-mono text-[#444444] text-xs">
            VANI · Team Slytherin · IIIT Dharwad
          </p>
        </div>
      </div>
    </section>
  )
}

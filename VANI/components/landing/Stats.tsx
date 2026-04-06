'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
          onEnter: () => setHasAnimated(true),
        },
      })

      // Main number animation
      tl.fromTo(
        '.stat-number-main',
        { innerText: 0 },
        {
          innerText: 4,
          duration: 1.5,
          ease: 'power2.out',
          snap: { innerText: 1 },
        }
      )

      // Other stats
      tl.fromTo(
        '.stat-number-40',
        { innerText: 0 },
        {
          innerText: 40,
          duration: 1.5,
          ease: 'power2.out',
          snap: { innerText: 1 },
        },
        '-=1.3'
      )

      tl.fromTo(
        '.stat-number-3',
        { innerText: 0 },
        {
          innerText: 3,
          duration: 1.5,
          ease: 'power2.out',
          snap: { innerText: 0.1 },
        },
        '-=1.3'
      )

      tl.fromTo(
        '.stat-number-0',
        { innerText: 0 },
        {
          innerText: 0,
          duration: 0.1,
          ease: 'power2.out',
        },
        '-=1.3'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main stat */}
        <div className="text-center mb-20">
          <div
            className="stat-number-main font-oxanium font-extrabold text-white"
            style={{ fontSize: 'clamp(80px, 15vw, 160px)' }}
          >
            0
          </div>
          <p className="font-lexend font-light text-[#8B8B8B] text-lg mt-4">
            Indian languages. Natively.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div
              className="stat-number-40 font-oxanium font-extrabold text-white"
              style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
            >
              0%
            </div>
            <p className="font-lexend font-light text-[#8B8B8B] text-sm mt-3">
              reduction in documentation time
            </p>
          </div>

          <div className="text-center">
            <div
              className="stat-number-3 font-oxanium font-extrabold text-white"
              style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
            >
              0x
            </div>
            <p className="font-lexend font-light text-[#8B8B8B] text-sm mt-3">
              faster loan resolution
            </p>
          </div>

          <div className="text-center">
            <div
              className="stat-number-0 font-oxanium font-extrabold text-white"
              style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
            >
              0
            </div>
            <p className="font-lexend font-light text-[#8B8B8B] text-sm mt-3">
              manual reports required
            </p>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-24 max-w-3xl mx-auto text-center">
          <blockquote className="font-lexend font-light text-[#8B8B8B] text-lg leading-relaxed mb-6">
            &ldquo;VANI understands what we say even when we switch between
            Kannada and English mid-sentence. That&apos;s unprecedented.&rdquo;
          </blockquote>
          <cite className="font-outfit font-medium text-white text-sm not-italic">
            Dr. Praneeth · IIIT Dharwad
          </cite>
        </div>
      </div>
    </section>
  )
}

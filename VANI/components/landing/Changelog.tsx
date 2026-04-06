'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Changelog() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Heading animation
      tl.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        }
      )

      // Cards stagger from bottom
      tl.fromTo(
        cardsRef.current?.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        },
        '-=0.4'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const updates = [
    {
      date: 'Apr 2025',
      title: 'Daily patient monitoring',
      desc: 'AI calls post-surgery patients every day and delivers recovery reports.',
    },
    {
      date: 'Mar 2025',
      title: 'Finance AI auto call',
      desc: 'Full loan recovery conversation via AI — no human agent required.',
    },
    {
      date: 'Feb 2025',
      title: 'Code-mixed speech support',
      desc: 'Kannada-Hindi-English switching handled natively by Sarvam ASR.',
    },
  ]

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Heading */}
          <div ref={headingRef}>
            <h2 className="font-outfit font-semibold text-white text-sm uppercase tracking-wider">
              What&apos;s new in VANI
            </h2>
          </div>

          {/* Update cards */}
          <div ref={cardsRef} className="md:col-span-3 space-y-4">
            {updates.map((update, i) => (
              <div
                key={i}
                className="group p-5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111111] hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-outfit font-medium text-white text-base mb-1">
                      {update.title}
                    </h3>
                    <p className="font-lexend font-light text-[#8B8B8B] text-sm leading-relaxed">
                      {update.desc}
                    </p>
                  </div>
                  <span className="font-mono text-[#444444] text-xs whitespace-nowrap ml-4">
                    {update.date}
                  </span>
                </div>
              </div>
            ))}

            {/* See all link */}
            <div className="pt-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#8B8B8B] hover:text-white transition-colors"
              >
                See all updates
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

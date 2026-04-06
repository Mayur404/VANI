'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function DualDomain() {
  const sectionRef = useRef<HTMLElement>(null)
  const healthcareRef = useRef<HTMLDivElement>(null)
  const financeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })

      // Healthcare card slides from left
      tl.fromTo(
        healthcareRef.current,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
        }
      )

      // Finance card slides from right
      tl.fromTo(
        financeRef.current,
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
        },
        '-=0.7'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const healthcareFeatures = [
    'Voice recording & transcription',
    'Auto medical report generation',
    'Patient monitoring programs',
    'Critical symptom alerts',
    'Multi-speaker diarization',
  ]

  const financeFeatures = [
    'AI outbound calls',
    'Payment verification',
    'Loan recovery conversations',
    'Follow-up scheduling',
    'Sentiment analysis',
  ]

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-oxanium font-extrabold text-white"
            style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}
          >
            One platform.
            <br />
            <span className="text-[#8B8B8B]">Two domains.</span>
          </h2>
        </div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Healthcare */}
          <div
            ref={healthcareRef}
            className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111]"
          >
            <div className="mb-6">
              <span className="text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                Healthcare
              </span>
            </div>

            <h3 className="font-outfit font-semibold text-white text-xl mb-3">
              For doctors and hospitals
            </h3>

            <p className="font-lexend font-light text-[#8B8B8B] text-sm mb-6 leading-relaxed">
              Voice recording, auto transcription, medical report generation,
              patient monitoring programs, critical alerts.
            </p>

            <ul className="space-y-3">
              {healthcareFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-[#0EA5E9]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[#8B8B8B]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Finance */}
          <div
            ref={financeRef}
            className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111111]"
          >
            <div className="mb-6">
              <span className="text-xs font-medium text-[#F59E0B] uppercase tracking-wider">
                Finance
              </span>
            </div>

            <h3 className="font-outfit font-semibold text-white text-xl mb-3">
              For banks and NBFCs
            </h3>

            <p className="font-lexend font-light text-[#8B8B8B] text-sm mb-6 leading-relaxed">
              AI outbound calls, payment verification, loan recovery
              conversations, follow-up scheduling, sentiment analysis.
            </p>

            <ul className="space-y-3">
              {financeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-[#F59E0B]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[#8B8B8B]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

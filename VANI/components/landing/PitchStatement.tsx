'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import IsometricIllustration from './ui/IsometricIllustration'

gsap.registerPlugin(ScrollTrigger)

export default function PitchStatement() {
  const sectionRef = useRef<HTMLElement>(null)
  const statementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const statement = statementRef.current
      if (statement) {
        // Split text into words for animation
        const content = statement.innerHTML
        statement.innerHTML = ''

        // Create spans for each word
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content

        const processNode = (node: Node) => {
          if (node.nodeType === 3) {
            // Text node
            const text = node.textContent || ''
            text.split(' ').forEach((word, i) => {
              if (word.trim()) {
                const span = document.createElement('span')
                span.innerHTML = word + ' '
                span.style.display = 'inline-block'
                span.style.opacity = '0'
                span.style.transform = 'translateY(20px)'
                statement.appendChild(span)
              } else {
                statement.appendChild(document.createTextNode(' '))
              }
            })
          } else {
            statement.appendChild(node.cloneNode(true))
          }
        }

        Array.from(tempDiv.childNodes).forEach(processNode)

        // Animate words
        gsap.to(statement.children, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.03,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: statement,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Statement */}
        <div
          ref={statementRef}
          className="mb-20"
          style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}
        >
          <span className="font-oxanium font-extrabold text-white">
            A new kind of clinical tool.
          </span>{' '}
          <span className="font-lexend font-light text-[#8B8B8B]">
            Purpose-built for multilingual India, VANI sets a new standard for
            voice-driven documentation in healthcare and finance.
          </span>
        </div>

        {/* Three columns */}
        <div className="grid md:grid-cols-3 gap-12">
          {/* Column 1 */}
          <div className="space-y-4">
            <IsometricIllustration type="layers" />
            <h3 className="font-outfit font-semibold text-white text-lg">
              Built for clinical workflows
            </h3>
            <p className="font-lexend font-light text-[#8B8B8B] text-sm leading-relaxed">
              Shaped by the documentation needs of doctors, nurses and field
              health workers.
            </p>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <IsometricIllustration type="nodes" />
            <h3 className="font-outfit font-semibold text-white text-lg">
              Powered by multilingual AI
            </h3>
            <p className="font-lexend font-light text-[#8B8B8B] text-sm leading-relaxed">
              Designed for Kannada, Hindi, English and Telugu — switching
              mid-sentence.
            </p>
          </div>

          {/* Column 3 */}
          <div className="space-y-4">
            <IsometricIllustration type="speed" />
            <h3 className="font-outfit font-semibold text-white text-lg">
              Designed for speed
            </h3>
            <p className="font-lexend font-light text-[#8B8B8B] text-sm leading-relaxed">
              Reduces documentation burden and restores focus to patient care.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

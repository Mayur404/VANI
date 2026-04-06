'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    // Navbar entrance animation
    if (navRef.current) {
      gsap.fromTo(navRef.current.children,
        { y: -10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
        }
      )
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(10,10,10,0.8)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]'
          : 'bg-transparent border-b border-transparent'
      }`}
      style={{ height: '56px' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left - Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 relative">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M4 12C4 12 5 8 8 8C11 8 11 16 14 16C17 16 18 12 20 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-wide">VANI</span>
        </Link>

        {/* Center - Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-[#8B8B8B] hover:text-white transition-colors duration-200">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-[#8B8B8B] hover:text-white transition-colors duration-200">
            How it works
          </Link>
          <Link href="#domains" className="text-sm text-[#8B8B8B] hover:text-white transition-colors duration-200">
            Domains
          </Link>
          <Link href="#pricing" className="text-sm text-[#8B8B8B] hover:text-white transition-colors duration-200">
            Pricing
          </Link>
        </div>

        {/* Right - Auth buttons */}
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-[#8B8B8B] hover:text-white transition-colors duration-200">
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-medium bg-white text-[#0A0A0A] px-4 py-1.5 rounded-full hover:scale-[1.02] transition-transform duration-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}

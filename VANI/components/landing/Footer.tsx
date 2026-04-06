'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h4 className="font-outfit font-medium text-white text-xs uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="#features"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="#domains"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Domains
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/voice"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Voice Recording
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/schedule"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Call Scheduling
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/alerts"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Alerts
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/analytics"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="font-outfit font-medium text-white text-xs uppercase tracking-wider mb-4">
              Technology
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://sarvam.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Sarvam AI
                </a>
              </li>
              <li>
                <a
                  href="https://anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Claude API
                </a>
              </li>
              <li>
                <span className="font-lexend text-[#8B8B8B] text-sm">
                  WebRTC
                </span>
              </li>
              <li>
                <span className="font-lexend text-[#8B8B8B] text-sm">
                  Prisma
                </span>
              </li>
              <li>
                <span className="font-lexend text-[#8B8B8B] text-sm">
                  Next.js
                </span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-outfit font-medium text-white text-xs uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="#about"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="https://iiitd.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  IIIT Dharwad
                </a>
              </li>
              <li>
                <a
                  href="https://hack2future.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Hack2Future
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-outfit font-medium text-white text-xs uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="font-lexend text-[#8B8B8B] text-sm hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[rgba(255,255,255,0.06)]">
          {/* Left - Logo and copyright */}
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-5 h-5 relative">
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
            <span className="font-lexend text-[#8B8B8B] text-xs">
              © 2025 VANI
            </span>
          </div>

          {/* Right - Social icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B8B8B] hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B8B8B] hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

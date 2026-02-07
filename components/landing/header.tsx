'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Scale, Menu, X } from 'lucide-react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-b border-gray-200 opacity-0 hover:opacity-100 transition-opacity duration-300" />

      <nav className="relative container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-navy-950 group-hover:text-blue-600 transition-colors">
              D'Avila Reis
            </span>
            <span className="text-xs text-gray-600 font-medium">Advogados</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-1">
          <Link href="#sobre" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
            Sobre
          </Link>
          <Link href="#servicos" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
            Serviços
          </Link>
          <Link href="#equipe" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
            Equipe
          </Link>
          <Link href="#contato" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
            Contato
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center space-x-4">
          <a href="tel:+551533844013" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
            (15) 3384-4013
          </a>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Portal do Cliente
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-gray-700 hover:text-blue-600 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link href="#sobre" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              Sobre
            </Link>
            <Link href="#servicos" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              Serviços
            </Link>
            <Link href="#equipe" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              Equipe
            </Link>
            <Link href="#contato" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              Contato
            </Link>
            <Link
              href="/login"
              className="block px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
            >
              Portal do Cliente
            </Link>
            <a href="tel:+551533844013" className="block px-4 py-2 text-blue-600 font-medium text-center hover:bg-blue-50 rounded-lg transition-colors">
              (15) 3384-4013
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

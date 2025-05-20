'use client'

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/images/logo.svg";

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="relative p-8 flex justify-center items-center font-bold text-sm">
            {/* Botão menu (mobile) */}
            <button
                className="block max-[750px]:absolute max-[750px]:left-5 max-[750px]:top-5 md:hidden z-20"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Abrir menu"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Menu Desktop */}
            <nav className="flex max-[750px]:hidden justify-center items-center gap-5 w-full">
                <Link href="/">PÁGINA INICIAL</Link>
                <Link href="/quem-somos">QUEM SOMOS</Link>
                <Link href="/">
                    <Image src={logo} alt="Logo" width={121} height={79} />
                </Link>
                <Link href="/produtos">PRODUTOS</Link>
                <Link href="/fale-conosco">FALE CONOSCO</Link>
            </nav>

            {/* Menu Mobile */}
            {menuOpen && (
                <nav className="absolute top-full left-0 w-full bg-white shadow-md flex flex-col items-center gap-4 py-6 font-bold text-sm z-10 md:hidden">
                    <Link href="/" onClick={() => setMenuOpen(false)}>PÁGINA INICIAL</Link>
                    <Link href="/quem-somos" onClick={() => setMenuOpen(false)}>QUEM SOMOS</Link>
                    <Link href="/produtos" onClick={() => setMenuOpen(false)}>PRODUTOS</Link>
                    <Link href="/fale-conosco" onClick={() => setMenuOpen(false)}>FALE CONOSCO</Link>
                </nav>
            )}
        </header>
    );
}

export default Header;

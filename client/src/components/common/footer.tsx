import React from "react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary text-white font-montserrat font-bold text-lg flex items-center justify-center rounded">
                G
              </div>
              <span className="ml-2 font-montserrat font-semibold text-lg tracking-tight text-primary">GECAN</span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">Global Energy & Commodities Alliance Network</p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs text-neutral-400">&copy; {new Date().getFullYear()} GECAN. All rights reserved.</p>
            <div className="mt-1">
              <Link href="/privacy-policy" className="text-xs text-neutral-500 hover:text-primary mr-4">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-xs text-neutral-500 hover:text-primary mr-4">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-xs text-neutral-500 hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

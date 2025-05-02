import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "GU";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    const links = [
      { href: "/", label: "Dashboard", active: location === "/" },
      { href: "/marketplace", label: "Marketplace", active: location.includes("/marketplace") },
      { href: "/toolkits", label: "Toolkits", active: location.includes("/toolkits") },
      { href: "/dd-center", label: "DD Center", active: location.includes("/dd-center") },
    ];

    // Add admin link if user is admin
    if (user?.role === "GECAN_Admin") {
      links.splice(1, 0, { 
        href: "/admin", 
        label: "Admin Panel", 
        active: location.includes("/admin") 
      });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="h-10 w-10 bg-primary text-white font-montserrat font-bold text-xl flex items-center justify-center rounded">
            G
          </div>
          <span className="ml-2 font-montserrat font-semibold text-xl tracking-tight text-primary">GECAN</span>
        </Link>
        
        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`font-medium transition-all ${
                link.active 
                  ? "text-neutral-800" 
                  : "text-neutral-500 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        {/* User Profile & Mobile Menu Button */}
        <div className="flex items-center">
          {user && (
            <div className="mr-4 relative">
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-600">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 focus:outline-none">
                  <Avatar className="h-8 w-8 bg-primary-200 text-primary-700">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                {user.memberType?.includes("Seller") && (
                  <DropdownMenuItem asChild>
                    <Link href="/my-offers" className="cursor-pointer">My Offers</Link>
                  </DropdownMenuItem>
                )}
                {user.memberType?.includes("Buyer") && (
                  <DropdownMenuItem asChild>
                    <Link href="/my-enquiries" className="cursor-pointer">My Enquiries</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/matches" className="cursor-pointer">My Matches</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
          
          {/* Mobile Menu Button */}
          <div className="ml-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-8">
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className={`py-2 font-medium text-lg ${
                          link.active 
                            ? "text-primary" 
                            : "text-neutral-600 hover:text-primary"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    {user && (
                      <>
                        <div className="h-px bg-neutral-200 my-2"></div>
                        <Link href="/profile" className="py-2 text-neutral-600 hover:text-primary">
                          Profile
                        </Link>
                        {user.memberType?.includes("Seller") && (
                          <Link href="/my-offers" className="py-2 text-neutral-600 hover:text-primary">
                            My Offers
                          </Link>
                        )}
                        {user.memberType?.includes("Buyer") && (
                          <Link href="/my-enquiries" className="py-2 text-neutral-600 hover:text-primary">
                            My Enquiries
                          </Link>
                        )}
                        <button 
                          onClick={handleLogout} 
                          className="py-2 text-left text-red-500 hover:text-red-600"
                        >
                          Sign Out
                        </button>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

import React from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbsProps {
  items: {
    label: string;
    href?: string;
  }[];
  backButton?: boolean;
  className?: string;
}

export default function Breadcrumbs({ 
  items, 
  backButton = true, 
  className = ""
}: BreadcrumbsProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (items.length > 1 && items[items.length - 2].href) {
      navigate(items[items.length - 2].href!);
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center text-sm text-neutral-500">
        <Link href="/" className="flex items-center hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4 mr-1" />
          <span>Home</span>
        </Link>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 mx-2 text-neutral-400" />
            {index === items.length - 1 || !item.href ? (
              <span className="font-medium text-neutral-800">{item.label}</span>
            ) : (
              <Link 
                href={item.href} 
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {backButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="text-sm"
        >
          Back
        </Button>
      )}
    </div>
  );
}
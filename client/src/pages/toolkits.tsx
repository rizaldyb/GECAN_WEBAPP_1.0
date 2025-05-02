import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UnitConverter from "@/components/toolkits/unit-converter";
import CurrencyConverter from "@/components/toolkits/currency-converter";
import DocumentTemplate from "@/components/toolkits/document-template";
import { Document } from "@shared/schema";
import { Link } from "wouter";
import AppLayout from "@/layouts/app-layout";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Breadcrumbs from "@/components/common/breadcrumbs";
import {
  ArrowLeft,
  ChevronDown,
  Calculator,
  PenSquare,
  Clock,
  BarChart3,
  Wrench,
  FileText,
  Grid3X3,
  Book,
  Globe,
  CreditCard,
  TrendingUp,
  Zap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Scale,
  FileSpreadsheet,
  TrendingDown,
  Search,
  Calculator as CalculatorIcon
} from "lucide-react";

export default function Toolkits() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("essential");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch documents from API
  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: !!user,
  });

  // Filter documents based on search
  const filteredDocuments = React.useMemo(() => {
    if (!documents) return [];
    
    if (!searchQuery) return documents;
    
    const query = searchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.templateName.toLowerCase().includes(query) ||
      doc.docType.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Define toolkit categories
  const categories = [
    { id: "essential", name: "Essential Tools", icon: <Wrench className="h-4 w-4 mr-2" /> },
    { id: "financial", name: "Financial Analysis", icon: <BarChart3 className="h-4 w-4 mr-2" /> },
    { id: "documents", name: "Document Templates", icon: <FileText className="h-4 w-4 mr-2" /> },
    { id: "compliance", name: "Compliance & Legal", icon: <Scale className="h-4 w-4 mr-2" /> },
    { id: "calculators", name: "Advanced Calculators", icon: <Calculator className="h-4 w-4 mr-2" /> }
  ];

  // Essential tools
  const essentialTools = [
    {
      id: "unit-converter",
      title: "Commodity Unit Converter",
      description: "Convert between different units for gold, petroleum, and other commodities",
      icon: <Grid3X3 className="h-6 w-6 text-amber-600" />,
      component: <UnitConverter />
    },
    {
      id: "currency-converter",
      title: "Multi-Currency Converter",
      description: "Real-time conversion between major global currencies with historical rates",
      icon: <Globe className="h-6 w-6 text-blue-600" />,
      component: <CurrencyConverter />
    },
    {
      id: "price-alerts",
      title: "Price Alert System",
      description: "Set alerts for commodity price changes with email and SMS notifications",
      icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
      component: <PriceAlertTool />
    },
    {
      id: "trade-calculator",
      title: "Trade Profit Calculator",
      description: "Calculate potential profits with fees, taxes, and exchange rates",
      icon: <DollarSign className="h-6 w-6 text-green-600" />,
      component: <TradeCalculator />
    }
  ];
  
  // Financial analysis tools
  const financialTools = [
    {
      id: "market-scanner",
      title: "Market Opportunity Scanner",
      description: "Analyze markets for arbitrage and trading opportunities across commodities",
      icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
      component: <MarketScanner />
    },
    {
      id: "risk-analyzer",
      title: "Transaction Risk Analyzer",
      description: "Assess transaction risks with weighted parameters and mitigation strategies",
      icon: <TrendingDown className="h-6 w-6 text-purple-600" />,
      component: <RiskAnalyzer />
    },
    {
      id: "exchange-rate-tracker",
      title: "Exchange Rate Tracker",
      description: "Monitor historical and current exchange rates with trend predictions",
      icon: <CreditCard className="h-6 w-6 text-indigo-600" />,
      component: <ExchangeRateTracker />
    },
    {
      id: "cash-flow-projector",
      title: "Cash Flow Projector",
      description: "Project cash flows from commodity trades with payment schedule optimization",
      icon: <FileSpreadsheet className="h-6 w-6 text-blue-600" />,
      component: <CashFlowProjector />
    }
  ];
  
  // Calculator tools
  const calculatorTools = [
    {
      id: "gold-purity",
      title: "Gold Purity & Value Calculator",
      description: "Calculate gold values based on purity, weight, and current market prices",
      icon: <CalculatorIcon className="h-6 w-6 text-yellow-600" />,
      component: <GoldCalculator />
    },
    {
      id: "shipping-cost",
      title: "Shipping Cost Estimator",
      description: "Estimate shipping costs with insurance for various commodity types",
      icon: <Briefcase className="h-6 w-6 text-slate-600" />,
      component: <ShippingCalculator />
    },
    {
      id: "financing-calculator",
      title: "Trade Financing Calculator",
      description: "Calculate financing costs, interest, and repayment schedules",
      icon: <CreditCard className="h-6 w-6 text-green-600" />,
      component: <FinancingCalculator />
    },
    {
      id: "margin-calculator",
      title: "Profit Margin Calculator",
      description: "Calculate margins with taxes, fees, and currency exchanges factored in",
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      component: <MarginCalculator />
    }
  ];
  
  // Compliance tools
  const complianceTools = [
    {
      id: "compliance-checker",
      title: "Regulatory Compliance Checker",
      description: "Check transaction compliance with international regulations and sanctions",
      icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
      component: <ComplianceChecker />
    },
    {
      id: "aml-guide",
      title: "AML Procedure Guide",
      description: "Interactive guide for Anti-Money Laundering procedures in commodity trading",
      icon: <Book className="h-6 w-6 text-blue-600" />,
      component: <AMLGuide />
    },
    {
      id: "restricted-entities",
      title: "Restricted Entities Scanner",
      description: "Search parties against international sanctions and restricted entity lists",
      icon: <Search className="h-6 w-6 text-red-600" />,
      component: <RestrictedEntitiesScanner />
    }
  ];

  // Display placeholder components for tools being developed
  function PriceAlertTool() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Set Price Alerts</h3>
          <p className="text-neutral-500 text-center">
            Monitor commodity prices and receive instant notifications when they reach your target levels.
          </p>
          <Button className="mt-6" variant="outline">Configure Alerts</Button>
        </CardContent>
      </Card>
    );
  }
  
  function TradeCalculator() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <DollarSign className="h-16 w-16 text-green-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Calculate Trade Profits</h3>
          <p className="text-neutral-500 text-center">
            Calculate potential profits including fees, taxes, and exchange rates for any commodity trade.
          </p>
          <Button className="mt-6" variant="outline">Calculate a Trade</Button>
        </CardContent>
      </Card>
    );
  }
  
  function MarketScanner() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <TrendingUp className="h-16 w-16 text-blue-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Scan Market Opportunities</h3>
          <p className="text-neutral-500 text-center">
            Identify arbitrage opportunities and market inefficiencies across global commodity markets.
          </p>
          <Button className="mt-6" variant="outline">Start Scanning</Button>
        </CardContent>
      </Card>
    );
  }
  
  function RiskAnalyzer() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <TrendingDown className="h-16 w-16 text-red-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Analyze Transaction Risk</h3>
          <p className="text-neutral-500 text-center">
            Comprehensive risk assessment for all aspects of commodity transactions with mitigation strategies.
          </p>
          <Button className="mt-6" variant="outline">Analyze Risk</Button>
        </CardContent>
      </Card>
    );
  }
  
  function ExchangeRateTracker() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <CreditCard className="h-16 w-16 text-indigo-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Track Exchange Rates</h3>
          <p className="text-neutral-500 text-center">
            Monitor and predict currency exchange rate movements to optimize trade timing.
          </p>
          <Button className="mt-6" variant="outline">View Rates</Button>
        </CardContent>
      </Card>
    );
  }
  
  function CashFlowProjector() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <FileSpreadsheet className="h-16 w-16 text-yellow-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Project Cash Flows</h3>
          <p className="text-neutral-500 text-center">
            Project and optimize cash flows from commodity transactions with payment schedule planning.
          </p>
          <Button className="mt-6" variant="outline">Create Projection</Button>
        </CardContent>
      </Card>
    );
  }
  
  function GoldCalculator() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <Calculator className="h-16 w-16 text-amber-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Calculate Gold Value</h3>
          <p className="text-neutral-500 text-center">
            Precise calculations of gold value based on purity, weight, and current market prices.
          </p>
          <Button className="mt-6" variant="outline">Calculate Value</Button>
        </CardContent>
      </Card>
    );
  }
  
  function ShippingCalculator() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <Briefcase className="h-16 w-16 text-slate-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Estimate Shipping</h3>
          <p className="text-neutral-500 text-center">
            Calculate shipping costs, insurance, and timing for commodity transport worldwide.
          </p>
          <Button className="mt-6" variant="outline">Get Estimate</Button>
        </CardContent>
      </Card>
    );
  }
  
  function FinancingCalculator() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <CreditCard className="h-16 w-16 text-green-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Trade Financing</h3>
          <p className="text-neutral-500 text-center">
            Calculate financing costs, interest rates, and repayment schedules for commodity trades.
          </p>
          <Button className="mt-6" variant="outline">Calculate Financing</Button>
        </CardContent>
      </Card>
    );
  }
  
  function MarginCalculator() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <TrendingUp className="h-16 w-16 text-blue-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Calculate Margins</h3>
          <p className="text-neutral-500 text-center">
            Complex margin calculations including all taxes, fees, and currency exchange impacts.
          </p>
          <Button className="mt-6" variant="outline">Calculate Margin</Button>
        </CardContent>
      </Card>
    );
  }
  
  function ComplianceChecker() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Check Compliance</h3>
          <p className="text-neutral-500 text-center">
            Ensure all transactions comply with international regulations, sanctions, and trade laws.
          </p>
          <Button className="mt-6" variant="outline">Run Compliance Check</Button>
        </CardContent>
      </Card>
    );
  }
  
  function AMLGuide() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <Book className="h-16 w-16 text-blue-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">AML Procedures</h3>
          <p className="text-neutral-500 text-center">
            Interactive guide for implementing Anti-Money Laundering best practices in commodity trading.
          </p>
          <Button className="mt-6" variant="outline">View Guide</Button>
        </CardContent>
      </Card>
    );
  }
  
  function RestrictedEntitiesScanner() {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <Search className="h-16 w-16 text-red-500 mb-6" />
          <h3 className="text-xl font-semibold text-center mb-2">Scan Restricted Entities</h3>
          <p className="text-neutral-500 text-center">
            Check transaction parties against international sanctions lists and restricted entity databases.
          </p>
          <Button className="mt-6" variant="outline">Scan Entities</Button>
        </CardContent>
      </Card>
    );
  }

  // Render appropriate tools based on active category
  const renderActiveTools = () => {
    switch (activeCategory) {
      case "essential":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            {essentialTools.map(tool => (
              <div key={tool.id}>
                {tool.component}
              </div>
            ))}
          </div>
        );
      case "financial":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            {financialTools.map(tool => (
              <div key={tool.id}>
                {tool.component}
              </div>
            ))}
          </div>
        );
      case "calculators":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            {calculatorTools.map(tool => (
              <div key={tool.id}>
                {tool.component}
              </div>
            ))}
          </div>
        );
      case "compliance":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {complianceTools.map(tool => (
              <div key={tool.id}>
                {tool.component}
              </div>
            ))}
          </div>
        );
      case "documents":
        return (
          <>
            <div className="mb-6 flex items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9 w-full sm:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="ml-4 bg-primary">
                <PenSquare className="h-4 w-4 mr-2" />
                Create Custom Template
              </Button>
            </div>
            
            {documentsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <CardHeader className="p-4 pb-2">
                      <div className="h-6 w-2/3 bg-neutral-200 rounded mb-1"></div>
                      <div className="h-4 w-1/3 bg-neutral-100 rounded"></div>
                    </CardHeader>
                    <CardContent className="p-4 py-2">
                      <div className="h-20 bg-neutral-100 rounded"></div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 border-t mt-2">
                      <div className="h-8 w-full bg-neutral-100 rounded"></div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center p-10 bg-neutral-50 rounded-lg">
                <FileText className="h-10 w-10 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                <p className="text-neutral-500 max-w-md mx-auto">
                  {searchQuery 
                    ? "No documents match your search criteria. Try different keywords."
                    : "There are no document templates available. Contact an administrator to add templates."}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc) => (
                  <DocumentTemplate key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 animate-fadeIn">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Toolkits", href: "/toolkits" },
            activeCategory === "essential" ? { label: "Essential Tools" } :
            activeCategory === "financial" ? { label: "Financial Analysis" } :
            activeCategory === "documents" ? { label: "Document Templates" } :
            activeCategory === "compliance" ? { label: "Compliance & Legal" } :
            { label: "Advanced Calculators" }
          ]}
          backButton={false}
        />
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mb-2">
            <div>
              <h1 className="font-montserrat font-bold text-2xl text-neutral-800">Advanced Trading Toolkits</h1>
              <p className="text-neutral-500">Comprehensive suite of professional tools for commodity traders</p>
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              className="font-medium w-fit"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> 
                Back to Dashboard
              </Link>
            </Button>
          </div>
          
          {/* Toolkit Categories */}
          <div className="mt-6 border-b border-neutral-200">
            <div className="flex overflow-x-auto pb-2 hide-scrollbar">
              {categories.map(category => (
                <Button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  variant={activeCategory === category.id ? "default" : "ghost"}
                  className={`mr-2 flex items-center rounded-full ${
                    activeCategory === category.id 
                      ? "bg-primary hover:bg-primary/90" 
                      : "text-neutral-700 hover:text-primary hover:bg-primary/10"
                  }`}
                  size="sm"
                >
                  {category.icon}
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="mb-6">
          {renderActiveTools()}
        </div>
      </div>
    </AppLayout>
  );
}
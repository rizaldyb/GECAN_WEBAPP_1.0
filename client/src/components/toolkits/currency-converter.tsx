import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw } from "lucide-react";

// Define currency data structure
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

// Major currencies for commodities trading
const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "ZAR", name: "South African Rand", symbol: "R" }
];

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [fromAmount, setFromAmount] = useState<string>("1000");
  const [toAmount, setToAmount] = useState<string>("");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<"from" | "to">("from");

  // Fetch exchange rates on component mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Fetch exchange rates from API
  const fetchExchangeRates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Note: In a real implementation, use an environment variable for the API key
      // For this example, we'll use a mock response for demonstration purposes
      
      // Mock exchange rates - In a real app, these would come from an API
      const mockRates: Record<string, number> = {
        "USD": 1,
        "EUR": 0.93,
        "GBP": 0.79,
        "CHF": 0.88,
        "JPY": 151.63,
        "CNY": 7.24,
        "AUD": 1.52,
        "CAD": 1.36,
        "AED": 3.67,
        "SGD": 1.34,
        "HKD": 7.82,
        "INR": 83.47,
        "RUB": 92.91,
        "ZAR": 18.27
      };
      
      setExchangeRates(mockRates);
      setLastUpdated(new Date().toLocaleString());
      
      // Calculate initial conversion
      calculateToAmount("1000", "USD", "EUR", mockRates);
      
      setIsLoading(false);
    } catch (err) {
      setError("Failed to fetch exchange rates. Please try again later.");
      setIsLoading(false);
    }
  };

  // Calculate conversion from amount and currencies
  const calculateToAmount = (amount: string, from: string, to: string, rates: Record<string, number> = exchangeRates) => {
    if (!amount || isNaN(Number(amount)) || !rates[from] || !rates[to]) {
      setToAmount("");
      return;
    }
    
    // Convert through base currency (USD)
    const amountInUSD = parseFloat(amount) / rates[from];
    const convertedAmount = amountInUSD * rates[to];
    
    // Format based on currency
    setToAmount(formatCurrencyValue(convertedAmount, to));
  };

  // Calculate from amount based on to amount
  const calculateFromAmount = (amount: string, to: string, from: string, rates: Record<string, number> = exchangeRates) => {
    if (!amount || isNaN(Number(amount)) || !rates[from] || !rates[to]) {
      setFromAmount("");
      return;
    }
    
    // Convert through base currency (USD)
    const amountInUSD = parseFloat(amount) / rates[to];
    const convertedAmount = amountInUSD * rates[from];
    
    // Format based on currency
    setFromAmount(formatCurrencyValue(convertedAmount, from));
  };

  // Format currency value based on currency code
  const formatCurrencyValue = (value: number, currencyCode: string): string => {
    if (isNaN(value)) return "";
    
    // Use different precision for JPY and other currencies with no fractional units
    if (currencyCode === "JPY" || currencyCode === "KRW" || currencyCode === "IDR" || currencyCode === "VND") {
      return Math.round(value).toString();
    }
    
    // For other currencies, show 2 decimal places
    return value.toFixed(2);
  };

  // Get display value with currency symbol
  const getDisplayValue = (amount: string, currencyCode: string): string => {
    if (!amount) return "";
    
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return amount;
    
    return `${currency.symbol} ${amount}`;
  };

  // Handle from amount change
  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromAmount(value);
    setLastModified("from");
    calculateToAmount(value, fromCurrency, toCurrency);
  };

  // Handle to amount change
  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToAmount(value);
    setLastModified("to");
    calculateFromAmount(value, toCurrency, fromCurrency);
  };

  // Handle from currency change
  const handleFromCurrencyChange = (value: string) => {
    setFromCurrency(value);
    if (lastModified === "from") {
      calculateToAmount(fromAmount, value, toCurrency);
    } else {
      calculateFromAmount(toAmount, toCurrency, value);
    }
  };

  // Handle to currency change
  const handleToCurrencyChange = (value: string) => {
    setToCurrency(value);
    if (lastModified === "from") {
      calculateToAmount(fromAmount, fromCurrency, value);
    } else {
      calculateFromAmount(toAmount, value, fromCurrency);
    }
  };

  // Swap currencies
  const handleSwap = () => {
    const oldFromCurrency = fromCurrency;
    const oldFromAmount = fromAmount;
    
    setFromCurrency(toCurrency);
    setFromAmount(toAmount);
    
    setToCurrency(oldFromCurrency);
    setToAmount(oldFromAmount);
    
    // Maintain last modified field
    if (lastModified === "from") {
      setLastModified("to");
    } else {
      setLastModified("from");
    }
  };

  // Refresh rates
  const handleRefresh = () => {
    fetchExchangeRates();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <i className="ri-exchange-dollar-line mr-2 text-primary"></i>
              Currency Converter
            </CardTitle>
            <CardDescription>
              {isLoading ? (
                "Loading latest exchange rates..."
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                `Last updated: ${lastUpdated}`
              )}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">From</label>
            <div className="space-y-2">
              <Input
                type="number"
                value={fromAmount}
                onChange={handleFromAmountChange}
                placeholder="Enter amount"
                disabled={isLoading}
              />
              <Select value={fromCurrency} onValueChange={handleFromCurrencyChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center">
                        <span className="w-6 inline-block">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="ml-2 text-neutral-500">- {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button variant="ghost" size="icon" onClick={handleSwap} disabled={isLoading} className="self-center">
              <RefreshCw className="h-4 w-4 rotate-90" />
            </Button>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">To</label>
            <div className="space-y-2">
              <Input
                type="number"
                value={toAmount}
                onChange={handleToAmountChange}
                placeholder="Converted amount"
                disabled={isLoading}
              />
              <Select value={toCurrency} onValueChange={handleToCurrencyChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center">
                        <span className="w-6 inline-block">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="ml-2 text-neutral-500">- {currency.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {!isLoading && !error && (
          <div className="mt-6 p-4 bg-primary/5 rounded-md border border-primary/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-neutral-700">Exchange Rate:</p>
                <p className="text-lg font-semibold mt-1">
                  1 {fromCurrency} = {(exchangeRates[toCurrency] / exchangeRates[fromCurrency]).toFixed(4)} {toCurrency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-700">Inverse:</p>
                <p className="text-lg font-semibold mt-1">
                  1 {toCurrency} = {(exchangeRates[fromCurrency] / exchangeRates[toCurrency]).toFixed(4)} {fromCurrency}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-xs text-neutral-500">
          <p>Note: Exchange rates are indicative and may vary from actual trading rates. For precise rates, please consult with your financial institution.</p>
        </div>
      </CardContent>
    </Card>
  );
}

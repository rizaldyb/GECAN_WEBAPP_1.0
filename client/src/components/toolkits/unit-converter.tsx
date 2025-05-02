import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw } from "lucide-react";

// Conversion unit types and their display names
type CommodityType = "gold" | "petroleum" | "volume" | "weight";

const unitTypes = [
  { value: "gold", label: "Gold", icon: "ri-vip-crown-line" },
  { value: "petroleum", label: "Petroleum", icon: "ri-oil-line" },
  { value: "volume", label: "Volume", icon: "ri-flask-line" },
  { value: "weight", label: "Weight", icon: "ri-scales-3-line" }
];

// Define conversion units and factors for each type
const unitDefinitions: Record<CommodityType, Array<{ unit: string, factor: number }>> = {
  gold: [
    { unit: "Troy Ounce (oz t)", factor: 1 },
    { unit: "Gram (g)", factor: 31.1034768 },
    { unit: "Kilogram (kg)", factor: 0.0311034768 },
    { unit: "Tola", factor: 2.66666667 },
    { unit: "Tael", factor: 0.75 },
    { unit: "Grain", factor: 480 }
  ],
  petroleum: [
    { unit: "Barrel (bbl)", factor: 1 },
    { unit: "Gallon (US)", factor: 42 },
    { unit: "Liter (L)", factor: 158.987295 },
    { unit: "Cubic Meter (m³)", factor: 0.158987295 },
    { unit: "Metric Ton (MT)", factor: 0.136 }
  ],
  volume: [
    { unit: "Liter (L)", factor: 1 },
    { unit: "Gallon (US)", factor: 0.264172 },
    { unit: "Gallon (UK)", factor: 0.219969 },
    { unit: "Cubic Meter (m³)", factor: 0.001 },
    { unit: "Cubic Foot (ft³)", factor: 0.0353147 },
    { unit: "Fluid Ounce (US)", factor: 33.814 }
  ],
  weight: [
    { unit: "Kilogram (kg)", factor: 1 },
    { unit: "Pound (lb)", factor: 2.20462 },
    { unit: "Metric Ton (MT)", factor: 0.001 },
    { unit: "Short Ton (US)", factor: 0.00110231 },
    { unit: "Long Ton (UK)", factor: 0.000984207 },
    { unit: "Ounce (oz)", factor: 35.274 }
  ]
};

export default function UnitConverter() {
  const [selectedType, setSelectedType] = useState<CommodityType>("gold");
  const [fromUnit, setFromUnit] = useState<string>(unitDefinitions[selectedType][0].unit);
  const [toUnit, setToUnit] = useState<string>(unitDefinitions[selectedType][1].unit);
  const [fromValue, setFromValue] = useState<string>("1");
  const [toValue, setToValue] = useState<string>("");
  const [lastModified, setLastModified] = useState<"from" | "to">("from");

  // Get units for the selected type
  const getUnits = () => unitDefinitions[selectedType];

  // Handle unit type change
  useEffect(() => {
    // Reset selected units when type changes
    setFromUnit(unitDefinitions[selectedType][0].unit);
    setToUnit(unitDefinitions[selectedType][1].unit);
    
    // Force calculation based on last modified field
    if (lastModified === "from") {
      calculateToValue(fromValue, unitDefinitions[selectedType][0].unit, unitDefinitions[selectedType][1].unit);
    } else {
      calculateFromValue(toValue, unitDefinitions[selectedType][1].unit, unitDefinitions[selectedType][0].unit);
    }
  }, [selectedType]);

  // Calculate conversion from source to target unit
  const convert = (value: number, fromUnit: string, toUnit: string): number => {
    const fromUnitObj = getUnits().find(u => u.unit === fromUnit);
    const toUnitObj = getUnits().find(u => u.unit === toUnit);
    
    if (!fromUnitObj || !toUnitObj) return 0;
    
    // Convert to base unit, then to target unit
    return value * (toUnitObj.factor / fromUnitObj.factor);
  };

  // Handle from value change
  const calculateToValue = (value: string, from: string, to: string) => {
    if (value === "" || isNaN(Number(value))) {
      setToValue("");
      return;
    }
    
    const numValue = parseFloat(value);
    const result = convert(numValue, from, to);
    
    // Format based on magnitude
    setToValue(formatNumber(result));
  };

  // Handle to value change
  const calculateFromValue = (value: string, to: string, from: string) => {
    if (value === "" || isNaN(Number(value))) {
      setFromValue("");
      return;
    }
    
    const numValue = parseFloat(value);
    const result = convert(numValue, to, from);
    
    // Format based on magnitude
    setFromValue(formatNumber(result));
  };

  // Format numbers with appropriate precision
  const formatNumber = (num: number): string => {
    if (num === 0) return "0";
    
    // Use more decimal places for small numbers, fewer for large numbers
    if (Math.abs(num) < 0.001) return num.toExponential(4);
    if (Math.abs(num) < 0.1) return num.toFixed(6);
    if (Math.abs(num) < 1) return num.toFixed(4);
    if (Math.abs(num) < 10) return num.toFixed(3);
    if (Math.abs(num) < 100) return num.toFixed(2);
    if (Math.abs(num) > 1000000) return num.toExponential(4);
    
    return num.toFixed(2);
  };

  // Swap from and to units
  const handleSwap = () => {
    const oldFromUnit = fromUnit;
    const oldFromValue = fromValue;
    
    setFromUnit(toUnit);
    setFromValue(toValue);
    
    setToUnit(oldFromUnit);
    setToValue(oldFromValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="ri-exchange-line mr-2 text-primary"></i>
          Unit Converter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Commodity Type</label>
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as CommodityType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select commodity type" />
            </SelectTrigger>
            <SelectContent>
              {unitTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="flex items-center">
                  <div className="flex items-center">
                    <i className={`${type.icon} mr-2`}></i>
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">From</label>
            <div className="space-y-2">
              <Input 
                type="number" 
                value={fromValue} 
                onChange={(e) => {
                  setFromValue(e.target.value);
                  setLastModified("from");
                  calculateToValue(e.target.value, fromUnit, toUnit);
                }}
                placeholder="Enter value"
              />
              <Select value={fromUnit} onValueChange={(value) => {
                setFromUnit(value);
                calculateToValue(fromValue, value, toUnit);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {getUnits().map((unit) => (
                    <SelectItem key={unit.unit} value={unit.unit}>
                      {unit.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button variant="ghost" size="icon" onClick={handleSwap} className="self-center">
              <RefreshCw className="h-4 w-4 rotate-90" />
            </Button>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">To</label>
            <div className="space-y-2">
              <Input 
                type="number" 
                value={toValue} 
                onChange={(e) => {
                  setToValue(e.target.value);
                  setLastModified("to");
                  calculateFromValue(e.target.value, toUnit, fromUnit);
                }}
                placeholder="Result"
              />
              <Select value={toUnit} onValueChange={(value) => {
                setToUnit(value);
                calculateToValue(fromValue, fromUnit, value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {getUnits().map((unit) => (
                    <SelectItem key={unit.unit} value={unit.unit}>
                      {unit.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-100 text-sm text-gray-600">
          <p className="font-medium mb-1">Common Conversions:</p>
          {selectedType === "gold" && (
            <ul className="space-y-1">
              <li>• 1 kg = 32.1507 troy ounces</li>
              <li>• 1 troy ounce = 31.1035 grams</li>
              <li>• 1 tola = 11.6638 grams</li>
            </ul>
          )}
          {selectedType === "petroleum" && (
            <ul className="space-y-1">
              <li>• 1 barrel = 42 US gallons</li>
              <li>• 1 barrel = 158.987 liters</li>
              <li>• 7.33 barrels = 1 metric ton (approximate)</li>
            </ul>
          )}
          {selectedType === "volume" && (
            <ul className="space-y-1">
              <li>• 1 cubic meter = 1,000 liters</li>
              <li>• 1 US gallon = 3.78541 liters</li>
              <li>• 1 UK gallon = 4.54609 liters</li>
            </ul>
          )}
          {selectedType === "weight" && (
            <ul className="space-y-1">
              <li>• 1 metric ton = 1,000 kilograms</li>
              <li>• 1 kilogram = 2.20462 pounds</li>
              <li>• 1 short ton = 2,000 pounds</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

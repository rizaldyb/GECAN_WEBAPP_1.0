import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  isPositive: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  iconBgColor,
  iconColor,
  isPositive,
}: StatCardProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-neutral-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <h3 className="font-montserrat font-semibold text-2xl mt-1">{value}</h3>
          <p className={`${isPositive ? "text-green-500" : "text-red-500"} text-xs mt-1 flex items-center`}>
            <i className={`${isPositive ? "ri-arrow-up-line" : "ri-arrow-down-line"} mr-1`}></i> 
            {change}
          </p>
        </div>
        <div className={`${iconBgColor} p-2 rounded ${iconColor}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
}

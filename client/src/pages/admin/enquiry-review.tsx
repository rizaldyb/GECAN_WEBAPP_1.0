import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnquiryReview() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6">Buyer Enquiry Review</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Enquiry Review Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            This section is currently under development. The Enquiry Review feature will allow administrators to
            review, approve or reject buyer enquiries before they are made available for matching.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
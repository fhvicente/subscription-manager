"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePayment } from "@/hooks/usePayment";
import { useState } from "react";

export default function PaymentPage() {
  const { createCheckoutSession, loading } = usePayment();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '€3,99',
      period: 'per month',
      features: [
        'Unlimited subscriptions',
        'Email and SMS notifications',
        'Detailed reports',
        'Priority support'
      ]
    },
    {
      id: 'yearly',
      name: 'Annual Plan',
      price: '€39,99',
      period: 'per year',
      features: [
        'Unlimited subscriptions',
        'Email and SMS notifications',
        'Detailed reports',
        'Priority support',
        'Save 20%'
      ],
      recommended: true
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    setProcessingPlan(planId);
    try {
      const session = await createCheckoutSession(planId);
      
      if (session && session.url) {
        // Redirect to Stripe Checkout
        window.location.href = session.url;
      } else {
        alert('Unable to start payment process. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred while processing your request. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Choose Your Plan</h1>
          <p className="mt-2 text-slate-600">Unlock premium features to better manage your subscriptions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`bg-white shadow-sm p-6 ${plan.recommended ? 'border-2 border-slate-900 relative' : ''}`}>
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-slate-900 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                  Recommended
                </div>
              )}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                <div>
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600 ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full cursor-pointer" 
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading || processingPlan !== null}
                >
                  {processingPlan === plan.id ? 'Processing...' : `Select ${plan.name}`}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">
            Secure payment processed by Stripe. You can cancel anytime.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

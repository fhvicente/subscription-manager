'use client'

import { IconList, IconCalculator, IconChart } from './icons';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 text-white">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Add Your Subscriptions</h3>
            <p className="text-slate-600 max-w-xs mx-auto">
              Simply input all your recurring payments and subscription services to get started.
            </p>
            <div className="mt-6 text-primary">
              <IconList className="w-12 h-12 mx-auto opacity-70" />
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center md:mt-12">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 text-white">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Get Smart Insights</h3>
            <p className="text-slate-600 max-w-xs mx-auto">
              Our system analyzes your spending patterns and provides valuable insights to optimize costs.
            </p>
            <div className="mt-6 text-primary">
              <IconCalculator className="w-12 h-12 mx-auto opacity-70" />
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 text-white">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Take Control & Save</h3>
            <p className="text-slate-600 max-w-xs mx-auto">
              Get timely reminders before renewals and make informed decisions about your subscriptions.
            </p>
            <div className="mt-6 text-primary">
              <IconChart className="w-12 h-12 mx-auto opacity-70" />
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="bg-slate-50 rounded-xl p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Our users save an average of $240 per year by managing their subscriptions
            </h3>
            <p className="text-slate-600 text-center">
              Join thousands of users who have taken control of their recurring expenses and eliminated unnecessary costs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 
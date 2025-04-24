'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CTA() {
  return (
    <section className="py-16 bg-gradient-to-b from-primary/5 to-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to take control of your subscriptions?
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Join thousands of users who save money every month by tracking and managing their subscriptions in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/sign-up">
                    Get Started Free
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                No credit card required. Free plan available.
              </p>
            </div>
            <div className="bg-primary/90 p-8 md:p-12 text-white flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-6">
                What our users are saying
              </h3>
              <blockquote className="mb-6">
                <p className="text-white/90 italic mb-4">
                  &ldquo;This app helped me discover I was paying for three streaming services I never used. I saved over $35 a month just by tracking my subscriptions!&rdquo;
                </p>
                <footer className="font-medium">
                  — Sarah J., Marketing Director
                </footer>
              </blockquote>
              <div className="flex items-center mt-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className={`w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center`}>
                      <span className="text-xs font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="ml-4">
                  <div className="font-medium">Joined by 10,000+ users</div>
                  <div className="text-white/80 text-sm">From individuals to businesses</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
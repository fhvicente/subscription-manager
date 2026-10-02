import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full bg-white shadow-sm p-8 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="h-8 w-8 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Payment Canceled
                    </h1>
                    <p className="text-slate-600 mb-4">
                        Your payment has been canceled and no charge was made.
                    </p>
                    <p className="text-slate-600">
                        You can continue using the free plan or try again
                        whenever you want.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button className="w-full" asChild>
                        <Link href="/payment">Try Again</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}

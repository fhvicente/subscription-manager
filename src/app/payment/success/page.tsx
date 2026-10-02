"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayment } from "@/hooks/usePayment";
import { useAuth } from "@/lib/auth";

// Define subscription type
interface Subscription {
    plan?: string;
    premiumUntil?: string;
    isActive?: boolean;
}

// Define error type
interface ApiError extends Error {
    response?: {
        status: number;
    };
}

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [authError, setAuthError] = useState(false);
    const { isTokenValid, getSubscriptionStatusBySession } = usePayment();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const { isAuthenticated, refreshUser } = useAuth();
    const [checkedAuth, setCheckedAuth] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [verificationCount, setVerificationCount] = useState(0);
    const MAX_VERIFICATIONS = 3;

    // Handle interface based on authentication state
    useEffect(() => {
        // This function will check authentication and prepare the UI accordingly
        const checkAuthentication = () => {
            // If we don't have a sessionId, we can't proceed
            if (!sessionId) {
                console.warn("No session ID provided in URL");
                return;
            }

            // Check user authentication
            const authenticated = isAuthenticated();
            console.log("Authentication state:", authenticated);

            if (!authenticated) {
                console.warn("User not authenticated on success page");
                setAuthError(true);
            }

            setCheckedAuth(true);
            setLoading(false);
        };

        checkAuthentication();
    }, [sessionId, isAuthenticated]);

    // Function to redirect to login with return to this page
    const redirectToLogin = useCallback(() => {
        if (!sessionId) return;

        const returnUrl = `/payment/success?session_id=${sessionId}`;
        const loginUrl = `/sign-in?redirect=${encodeURIComponent(returnUrl)}`;

        router.push(loginUrl);
    }, [sessionId, router]);

    // Function to fetch subscription status
    const fetchSubscriptionStatus = useCallback(async () => {
        if (
            !sessionId ||
            authError ||
            !isTokenValid ||
            !isAuthenticated() ||
            isRedirecting
        ) {
            console.warn(
                "Cannot check status: user not authenticated, invalid session, or already redirecting"
            );
            return;
        }

        // Track verification attempt
        setVerificationCount((prev) => prev + 1);

        try {
            setRefreshing(true);
            const status = await getSubscriptionStatusBySession(sessionId);
            setSubscription(status);

            // If subscription is active, update user data and prepare for redirect
            if (status?.isActive) {
                await refreshUser();
                setIsRedirecting(true);

                // Schedule redirect after 3 seconds
                setTimeout(() => {
                    router.push("/dashboard");
                }, 3000);
            } else if (verificationCount < MAX_VERIFICATIONS) {
                // Schedule another check in 5 seconds if we haven't reached max attempts
                setTimeout(() => {
                    fetchSubscriptionStatus();
                }, 5000);
            }

            return status;
        } catch (error) {
            console.error("Error fetching subscription status:", error);

            // If it's a 401 error, set authError to show login message
            if ((error as ApiError)?.response?.status === 401) {
                setAuthError(true);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [
        sessionId,
        authError,
        isTokenValid,
        isAuthenticated,
        getSubscriptionStatusBySession,
        refreshUser,
        router,
        verificationCount,
        isRedirecting,
    ]);

    // Effect to trigger initial status check
    useEffect(() => {
        if (
            checkedAuth &&
            !authError &&
            isAuthenticated() &&
            isTokenValid &&
            !isRedirecting &&
            verificationCount === 0
        ) {
            fetchSubscriptionStatus();
        }
    }, [
        checkedAuth,
        authError,
        isAuthenticated,
        isTokenValid,
        fetchSubscriptionStatus,
        isRedirecting,
        verificationCount,
    ]);

    // If user is not authenticated, show login screen
    if (authError) {
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
                            Verify Your Payment
                        </h1>
                        <p className="text-slate-600 mb-6">
                            To verify your payment status, you need to log in
                            again. Your payment has already been processed, but
                            we need to verify its status.
                        </p>
                        <Button
                            className="w-full mb-3"
                            onClick={redirectToLogin}
                        >
                            Login to Verify
                        </Button>
                        <div className="text-xs text-slate-500 mt-4">
                            Your Session ID: {sessionId}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full bg-white shadow-sm p-8 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="h-8 w-8 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Payment Received!
                    </h1>
                    <p className="text-slate-600">
                        We have received your payment. We are verifying your
                        premium plan.
                    </p>
                </div>

                {loading ? (
                    <p className="text-slate-600">
                        Loading subscription details...
                    </p>
                ) : subscription ? (
                    <div className="bg-slate-50 p-4 rounded-md mb-6 text-left">
                        <h2 className="font-medium text-slate-900 mb-2">
                            Subscription Details
                        </h2>
                        <p className="text-sm text-slate-600 mb-1">
                            <span className="font-medium">Plan:</span>{" "}
                            {subscription.plan === "premium"
                                ? "Premium"
                                : "Free"}
                        </p>
                        {subscription.premiumUntil && (
                            <p className="text-sm text-slate-600 mb-1">
                                <span className="font-medium">
                                    Valid until:
                                </span>{" "}
                                {new Date(
                                    subscription.premiumUntil
                                ).toLocaleDateString()}
                            </p>
                        )}
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">Status:</span>{" "}
                            {subscription.isActive ? "Active" : "Inactive"}
                        </p>

                        {!subscription.isActive && (
                            <div className="mt-3">
                                <p className="text-xs text-amber-700">
                                    Your payment has been processed, but the
                                    premium plan has not been activated yet.
                                    This may take a few moments.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 text-xs"
                                    onClick={fetchSubscriptionStatus}
                                    disabled={refreshing}
                                >
                                    {refreshing ? "Updating..." : "Check again"}
                                </Button>
                            </div>
                        )}

                        {subscription.isActive && (
                            <div className="mt-3">
                                <p className="text-sm text-green-600 font-medium mb-2">
                                    ✓ Your premium subscription is active!
                                </p>
                                <p className="text-xs text-slate-600">
                                    You can now start using all premium
                                    features.
                                </p>
                                <p className="text-xs text-slate-600 mt-2">
                                    You will be redirected to the dashboard
                                    automatically...
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-md mb-6">
                        <p className="text-amber-600 text-sm">
                            We are waiting for payment confirmation. This may
                            take a few moments.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full text-xs"
                            onClick={fetchSubscriptionStatus}
                            disabled={refreshing}
                        >
                            {refreshing
                                ? "Checking..."
                                : "Check payment status"}
                        </Button>
                    </div>
                )}

                <div className="space-y-3">
                    <Button className="w-full" asChild>
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/settings">View Settings</Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}

// Loading fallback component
function PaymentLoadingFallback() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full bg-white shadow-sm p-8 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="animate-spin h-8 w-8 text-slate-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Loading...
                    </h1>
                    <p className="text-slate-600">
                        We are verifying your payment.
                    </p>
                </div>
            </Card>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<PaymentLoadingFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    );
}

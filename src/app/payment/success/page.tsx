"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { useStaggerReveal } from "@/lib/gsap";
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
    const root = useRef<HTMLDivElement>(null);
    useStaggerReveal(root, [loading, authError, subscription]);

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
                "Cannot check status: user not authenticated, invalid session, or already redirecting",
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
            <div ref={root} className="min-h-svh bg-paper text-ink">
                <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 lg:py-12">
                    <Link
                        href="/"
                        aria-label="SubTrack home"
                        className="inline-flex w-fit rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                    >
                        <Logo />
                    </Link>
                    <div data-reveal className="mt-16">
                        <p className="eyebrow text-ink-soft">
                            Payment received
                        </p>
                        <h1 className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)]">
                            Sign in to confirm it.
                        </h1>
                        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">
                            Your payment has already been processed. Log in
                            again so we can check its status and switch on your
                            plan.
                        </p>
                    </div>
                    <div data-reveal className="mt-8 space-y-4">
                        <Button size="lg" onClick={redirectToLogin}>
                            Login to Verify
                        </Button>
                        <p className="text-xs text-ink-soft">
                            Your Session ID:{" "}
                            <span className="break-all tabular-nums">
                                {sessionId}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isActive = subscription?.isActive;

    return (
        <div ref={root} className="min-h-svh bg-acid text-ink">
            <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
                <Link
                    href="/"
                    aria-label="SubTrack home"
                    className="inline-flex w-fit rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-acid"
                >
                    <Logo />
                </Link>

                <div data-reveal className="mt-16 lg:mt-24">
                    <p className="eyebrow">Payment received</p>
                    <h1 className="display mt-4 text-[clamp(3.5rem,13vw,8rem)]">
                        {isActive ? "You're in." : "Paid. Checking."}
                    </h1>
                    <p className="mt-6 max-w-lg text-lg font-medium leading-snug">
                        {isActive
                            ? "Premium is on. Go find the subscriptions you forgot."
                            : "We have your payment. We are confirming your premium plan with Stripe."}
                    </p>
                </div>

                <div data-reveal className="mt-10 max-w-lg" aria-live="polite">
                    {loading ? (
                        <p className="flex items-center gap-2 font-medium">
                            <Loader2
                                aria-hidden="true"
                                className="size-4 animate-spin text-ink"
                            />
                            Loading subscription details...
                        </p>
                    ) : subscription ? (
                        <div className="rounded-xl bg-paper p-5 sm:p-6">
                            <h2 className="eyebrow text-ink-soft">
                                Subscription Details
                            </h2>
                            <dl className="mt-3 divide-y divide-ink/10 text-sm">
                                <div className="flex justify-between gap-4 py-2.5">
                                    <dt className="text-ink-soft">Plan</dt>
                                    <dd className="font-semibold">
                                        {subscription.plan === "premium"
                                            ? "Premium"
                                            : "Free"}
                                    </dd>
                                </div>
                                {subscription.premiumUntil && (
                                    <div className="flex justify-between gap-4 py-2.5">
                                        <dt className="text-ink-soft">
                                            Valid until
                                        </dt>
                                        <dd className="font-semibold tabular-nums">
                                            {new Date(
                                                subscription.premiumUntil,
                                            ).toLocaleDateString()}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-4 py-2.5">
                                    <dt className="text-ink-soft">Status</dt>
                                    <dd>
                                        <span
                                            className={
                                                subscription.isActive
                                                    ? "rounded-full bg-acid px-2.5 py-0.5 text-xs font-bold text-ink"
                                                    : "rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-bold text-ink-soft"
                                            }
                                        >
                                            {subscription.isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </dd>
                                </div>
                            </dl>

                            {!subscription.isActive && (
                                <div className="mt-4">
                                    <p className="text-sm text-ink-soft">
                                        Your payment has been processed, but the
                                        premium plan has not been activated yet.
                                        This may take a few moments.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={fetchSubscriptionStatus}
                                        disabled={refreshing}
                                    >
                                        {refreshing
                                            ? "Updating..."
                                            : "Check again"}
                                    </Button>
                                </div>
                            )}

                            {subscription.isActive && (
                                <div className="mt-4 space-y-1 text-sm text-ink-soft">
                                    <p className="font-semibold text-ink">
                                        Your premium subscription is active.
                                    </p>
                                    <p>
                                        You can now use every premium feature.
                                    </p>
                                    <p>
                                        Taking you to the dashboard in a
                                        moment...
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl bg-paper p-5 sm:p-6">
                            <p className="text-sm text-ink-soft">
                                We are waiting for payment confirmation. This
                                may take a few moments.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={fetchSubscriptionStatus}
                                disabled={refreshing}
                            >
                                {refreshing
                                    ? "Checking..."
                                    : "Check payment status"}
                            </Button>
                        </div>
                    )}
                </div>

                <div
                    data-reveal
                    className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
                >
                    <Button
                        size="lg"
                        className="hover:bg-paper hover:text-ink"
                        asChild
                    >
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                    <Button variant="link" className="text-base" asChild>
                        <Link href="/settings">View Settings</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Loading fallback component
function PaymentLoadingFallback() {
    return (
        <div className="flex min-h-svh items-center bg-acid px-5 text-ink sm:px-8">
            <div className="mx-auto w-full max-w-3xl">
                <Loader2
                    aria-hidden="true"
                    className="size-8 animate-spin text-ink"
                />
                <h1 className="display mt-6 text-[clamp(2.25rem,5vw,3.5rem)]">
                    Loading...
                </h1>
                <p className="mt-3 text-lg font-medium">
                    We are verifying your payment.
                </p>
            </div>
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

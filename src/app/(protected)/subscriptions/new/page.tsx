"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { api } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useStaggerReveal } from "@/lib/gsap";
import { useDialog } from "@/components/DialogProvider";
import { CATEGORIES, subscriptionFormSchema } from "@/lib/subscription-schema";

const FIELD =
    "flex w-full min-w-0 rounded-md border-[1.5px] border-input bg-card px-3.5 text-base text-ink transition-[border-color,box-shadow] outline-none hover:border-ink/40 placeholder:text-muted-foreground focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-acid aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

type FormInput = z.input<typeof subscriptionFormSchema>;
type FormOutput = z.output<typeof subscriptionFormSchema>;

export default function NewSubscriptionPage() {
    const router = useRouter();
    const { alert, confirm } = useDialog();
    const [showSuccess, setShowSuccess] = useState(false);
    const form = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(subscriptionFormSchema),
        defaultValues: { name: "", price: "", category: "", dueDate: new Date(), description: "" },
    });
    const isSubmitting = form.formState.isSubmitting;
    const rootRef = useRef<HTMLDivElement>(null);

    useStaggerReveal(rootRef, [showSuccess]);

    const onSubmit = async (values: FormOutput) => {
        try {
            await api.post("/subscriptions", {
                ...values,
                dueDate: values.dueDate.toISOString(),
                status: "active",
            });

            setShowSuccess(true);
            setTimeout(() => {
                router.push("/subscriptions");
                router.refresh();
            }, 2000);
        } catch (error) {
            if (isAxiosError(error) && error.response?.data?.code === "FREE_PLAN_LIMIT") {
                const upgrade = await confirm(
                    "The free plan tracks up to 3 subscriptions. Go Premium for unlimited.",
                    { title: "Free plan limit reached", confirmLabel: "See Premium" }
                );
                if (upgrade) router.push("/payment");
                return;
            }
            console.error("Error creating subscription:", error);
            alert("Unable to create the subscription. Please try again later.");
        }
    };

    if (showSuccess) {
        return (
            <div ref={rootRef} className="mx-auto max-w-xl">
                <div
                    role="status"
                    className="rounded-xl bg-acid p-8 text-ink"
                >
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                    <p className="font-wide mt-4 text-2xl font-extrabold tracking-[-0.03em]">
                        Subscription added.
                    </p>
                    <p className="mt-2">You&apos;ll be redirected to your subscriptions page.</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="mx-auto max-w-xl space-y-10">
            <header data-reveal>
                <Button asChild variant="ghost" className="-ml-3">
                    <Link href="/subscriptions">
                        <ArrowLeft aria-hidden="true" />
                        Back to subscriptions
                    </Link>
                </Button>
                <p className="eyebrow mt-6 text-ink-soft">New subscription</p>
                <h1 className="display mt-3 text-[clamp(2.25rem,5vw,3.5rem)] text-ink">
                    Add one more
                </h1>
            </header>
            <Form {...form}>
            <form
                data-reveal
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Netflix, Spotify, gym..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price (€)</FormLabel>
                            <FormControl>
                                <Input
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    className="tabular-nums"
                                    {...field}
                                    // only digits and one . or , with up to 2 decimals
                                    onChange={(e) => {
                                        if (/^\d{0,6}([.,]\d{0,2})?$/.test(e.target.value)) field.onChange(e);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                                <select className={`${FIELD} h-11`} {...field}>
                                    <option value="">Select a category</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Renewal date</FormLabel>
                            <div className="inline-block w-fit rounded-xl border bg-card p-2 tabular-nums">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    required
                                />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Notes <span className="font-normal text-ink-soft">(optional)</span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Shared with family, annual plan, cancel after trial..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-ink/10 bg-paper py-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" asChild>
                        <Link href="/subscriptions">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                Saving...
                            </>
                        ) : (
                            "Add subscription"
                        )}
                    </Button>
                </div>
            </form>
            </Form>
        </div>
    );
}

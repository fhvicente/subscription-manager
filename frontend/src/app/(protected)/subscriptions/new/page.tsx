"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";
import { api } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function NewSubscriptionPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        description: "",
        dueDate: new Date(),
        status: "active",
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.dueDate) {
            alert(
                "Please fill in the required fields: Name, Price, and Renewal Date"
            );
            return;
        }

        try {
            setIsSubmitting(true);

            // Format data for API
            const subscriptionData = {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                dueDate: formData.dueDate.toISOString(),
                category: formData.category || undefined,
                status: formData.status,
            };

            console.log("Sending data to API:", subscriptionData); // Log data for debugging

            await api.post("/subscriptions", subscriptionData);

            // Show success message
            setShowSuccess(true);

            // Navigate back to subscriptions list after a delay
            setTimeout(() => {
                router.push("/subscriptions");
                router.refresh(); // Refresh to show the new data
            }, 2000);
        } catch (error) {
            console.error("Error creating subscription:", error);
            alert("Unable to create the subscription. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateChange = (date: Date | undefined) => {
        setFormData((prev) => ({ ...prev, dueDate: date as Date }));
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                    <h2 className="text-xl font-semibold">
                        Subscription created successfully!
                    </h2>
                </div>
                <p className="text-slate-600">
                    Redirecting to subscription list...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <Link
                    href="/subscriptions"
                    className="text-slate-600 hover:text-slate-900 mr-2"
                >
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">
                    Add Subscription
                </h1>
            </div>

            <Card className="bg-white shadow-sm p-6">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Subscription Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Netflix, Spotify, Gym"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select a category</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Music">Music</option>
                            <option value="Software">Software</option>
                            <option value="Health">Health</option>
                            <option value="Education">Education</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Renewal Date</Label>
                        <div className="border rounded-md p-2">
                            <Calendar
                                mode="single"
                                selected={formData.dueDate}
                                onSelect={handleDateChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description (optional)
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Additional notes about this subscription"
                        />
                    </div>

                    <div className="pt-4 flex justify-end space-x-2">
                        <Button variant="outline" asChild>
                            <Link href="/subscriptions">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Subscription"
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

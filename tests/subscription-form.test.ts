import { describe, expect, it } from "vitest";
import { subscriptionFormSchema } from "@/lib/subscription-schema";

// The form on /subscriptions/new: string inputs -> API payload.
const form = { name: "Spotify", price: "9.99", category: "", dueDate: new Date(), description: "" };
const parse = (patch: object) => subscriptionFormSchema.safeParse({ ...form, ...patch });

describe("subscriptionFormSchema", () => {
    it.each([
        ["9.99", 9.99],
        ["9,99", 9.99],
        ["10", 10],
        [" 12.5 ", 12.5],
        ["999999.99", 999999.99],
    ])("accepts price %s", (price, expected) => {
        const r = parse({ price });
        expect(r.success && r.data.price).toBe(expected);
    });

    it.each(["", "abc", "0", "0.00", "-5", "9.999", "1e3", "1234567", "9.99.9"])("rejects price %j", (price) => {
        expect(parse({ price }).success).toBe(false);
    });

    it("trims the name and rejects blank or >100 chars", () => {
        const r = parse({ name: "  Netflix  " });
        expect(r.success && r.data.name).toBe("Netflix");
        expect(parse({ name: "   " }).success).toBe(false);
        expect(parse({ name: "x".repeat(101) }).success).toBe(false);
    });

    it("empty category becomes undefined; unknown category is rejected", () => {
        const r = parse({ category: "" });
        expect(r.success && r.data.category).toBeUndefined();
        expect(parse({ category: "Gaming" }).success).toBe(false);
    });

    it("requires a real date and notes under 500 chars", () => {
        expect(parse({ dueDate: undefined }).success).toBe(false);
        expect(parse({ dueDate: "2026-10-10" }).success).toBe(false);
        expect(parse({ description: "x".repeat(501) }).success).toBe(false);
    });
});

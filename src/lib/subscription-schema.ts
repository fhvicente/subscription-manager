import { z } from "zod";

export const CATEGORIES = ["Entertainment", "Music", "Software", "Health", "Education", "Other"] as const;
export const FREE_PLAN_LIMIT = 3;

// 9.99, 9,99, 10 - up to 6 digits and 2 decimals. Comma accepted for PT keyboards.
const PRICE = /^\d{1,6}([.,]\d{1,2})?$/;

// Form values (strings from the inputs) -> what the API expects.
export const subscriptionFormSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Keep it under 100 characters"),
    price: z
        .string()
        .trim()
        .min(1, "Price is required")
        .regex(PRICE, "Enter a price like 9.99")
        .transform((v) => Number(v.replace(",", ".")))
        .refine((n) => n > 0, "Price must be more than 0"),
    category: z.enum(CATEGORIES).or(z.literal("")).transform((v) => v || undefined),
    dueDate: z.date({ error: "Pick a renewal date" }),
    description: z.string().trim().max(500, "Keep notes under 500 characters"),
});

const STATUS = z.enum(["active", "inactive", "cancelled"]);

const subscriptionFields = z.object({
    name: z.string().trim().min(1).max(100),
    price: z
        .number()
        .positive()
        .max(999_999.99)
        .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "At most 2 decimals"),
    dueDate: z.iso.datetime(),
    category: z.enum(CATEGORIES).optional(),
    description: z.string().trim().max(500).optional(),
    status: STATUS,
});

// Request body of POST /api/subscriptions.
export const subscriptionCreateSchema = subscriptionFields.extend({ status: STATUS.default("active") });

// Request body of PUT /api/subscriptions/:id. No defaults here, or a partial update would reset fields.
export const subscriptionUpdateSchema = subscriptionFields.partial();

import { z } from "zod";

// Parses the JSON body with `schema`: the data, or a 400 Response listing the bad fields.
export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T> | Response> {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    return parsed.success
        ? parsed.data
        : Response.json(
              { message: "Invalid request", errors: z.flattenError(parsed.error).fieldErrors },
              { status: 400 }
          );
}

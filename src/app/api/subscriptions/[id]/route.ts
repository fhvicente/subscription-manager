import { get, run } from "@/server/db";
import { getUser, unauthorized } from "@/server/auth";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => Response.json({ message: "Subscription not found" }, { status: 404 });
const find = (id: string, userId: string) =>
    get("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?", [id, userId]);

// request body key -> column
const columns = {
    name: "name",
    description: "description",
    price: "price",
    dueDate: "due_date",
    status: "status",
    category: "category",
} as const;

export async function GET(req: Request, { params }: Ctx) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const subscription = await find((await params).id, user.id);
    return subscription ? Response.json(subscription) : notFound();
}

export async function PUT(req: Request, { params }: Ctx) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const { id } = await params;
    if (!await find(id, user.id)) return notFound();

    const body = await req.json();
    const fields = Object.entries(columns).filter(([key]) => body[key] !== undefined);
    if (!fields.length) {
        return Response.json({ message: "No fields to update" }, { status: 400 });
    }

    await run(
        `UPDATE subscriptions SET ${fields.map(([, col]) => `${col} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
        [...fields.map(([key]) => body[key]), id, user.id]
    );
    return Response.json(await find(id, user.id));
}

export async function DELETE(req: Request, { params }: Ctx) {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const { id } = await params;
    const { changes } = await run("DELETE FROM subscriptions WHERE id = ? AND user_id = ?", [id, user.id]);
    return changes ? new Response(null, { status: 204 }) : notFound();
}

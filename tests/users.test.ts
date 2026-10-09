import { beforeEach, describe, expect, it, vi } from "vitest";
import * as profile from "@/app/api/users/profile/route";
import * as settings from "@/app/api/notifications/settings/route";
import * as notifTest from "@/app/api/notifications/test/route";
import { req, reset, signUp } from "./helpers";

beforeEach(reset);

describe("/api/users/profile", () => {
    it("401 without token", async () => {
        expect((await profile.GET(req("GET"))).status).toBe(401);
        expect((await profile.PUT(req("PUT", { body: { name: "X" } }))).status).toBe(401);
    });

    it("GET returns the profile without password", async () => {
        const { token, email } = await signUp();
        const body = await (await profile.GET(req("GET", { token }))).json();
        expect(body).toMatchObject({ email, name: "Ana", plan: "free" });
        expect(body.password).toBeUndefined();
    });

    it("tells the client whether the user is an admin (ADMIN_EMAILS, case-insensitive)", async () => {
        vi.stubEnv("ADMIN_EMAILS", " other@test.dev , Boss@Test.dev");
        try {
            const boss = await signUp("boss@test.dev");
            const ana = await signUp("ana@test.dev");
            expect((await (await profile.GET(req("GET", { token: boss.token }))).json()).isAdmin).toBe(true);
            expect((await (await profile.GET(req("GET", { token: ana.token }))).json()).isAdmin).toBe(false);
        } finally {
            vi.unstubAllEnvs();
        }
    });

    it("PUT updates the name", async () => {
        const { token } = await signUp();
        const res = await profile.PUT(req("PUT", { token, body: { name: "Beatriz" } }));
        expect(res.status).toBe(200);
        expect((await res.json()).name).toBe("Beatriz");
    });

    it("PUT ignores fields other than name (no plan escalation)", async () => {
        const { token } = await signUp();
        const res = await profile.PUT(req("PUT", { token, body: { name: "Ana", plan: "premium", email: "x@y.z" } }));
        expect(await res.json()).toMatchObject({ plan: "free", name: "Ana" });
    });

    it("PUT without a name is a 400, not a crash", async () => {
        const { token } = await signUp();
        const res = await profile.PUT(req("PUT", { token, body: {} }));
        expect(res.status).toBe(400);
    });
});

describe("/api/notifications/settings", () => {
    it("GET creates defaults on first access", async () => {
        const { token } = await signUp();
        const body = await (await settings.GET(req("GET", { token }))).json();
        expect(body).toMatchObject({ email_enabled: 1, sms_enabled: 0, push_enabled: 0, days_before_renewal: 3 });
    });

    it("PUT updates only the fields sent and stores booleans as 1/0", async () => {
        const { token } = await signUp();
        const res = await settings.PUT(req("PUT", { token, body: { email_enabled: false, days_before_renewal: 7 } }));
        expect(await res.json()).toMatchObject({ email_enabled: 0, sms_enabled: 0, days_before_renewal: 7 });
    });

    it("PUT with a non-numeric days_before_renewal is a 400, not a crash", async () => {
        const { token } = await signUp();
        const res = await settings.PUT(req("PUT", { token, body: { days_before_renewal: "abc" } }));
        expect(res.status).toBe(400);
    });
});

describe("POST /api/notifications/test", () => {
    it("sends (simulated) email and simulates sms/push", async () => {
        const { token } = await signUp();
        for (const type of ["email", "sms", "push"]) {
            const res = await notifTest.POST(req("POST", { token, body: { type } }));
            expect(res.status).toBe(200);
            expect((await res.json()).success).toBe(true);
        }
    });

    it("rejects an unknown type", async () => {
        const { token } = await signUp();
        expect((await notifTest.POST(req("POST", { token, body: { type: "fax" } }))).status).toBe(400);
    });
});

"use client";

import { createContext, useCallback, useContext, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Options = { title?: string; confirmLabel?: string; destructive?: boolean };
type Open = Options & { message: string; isConfirm: boolean; resolve: (ok: boolean) => void };
type Dialog = {
    alert: (message: string, opts?: Options) => Promise<void>;
    confirm: (message: string, opts?: Options) => Promise<boolean>;
};

const DialogContext = createContext<Dialog | null>(null);

// Promise-based replacement for window.alert/confirm, rendered with the shadcn AlertDialog.
// ponytail: one dialog at a time; a second call while one is open replaces it (and resolves the first as cancelled).
export function DialogProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState<Open | null>(null);

    const show = useCallback(
        (message: string, isConfirm: boolean, opts: Options = {}) =>
            new Promise<boolean>((resolve) =>
                setOpen((prev) => {
                    prev?.resolve(false);
                    return { ...opts, message, isConfirm, resolve };
                })
            ),
        []
    );

    const [api] = useState<Dialog>(() => ({
        alert: async (message, opts) => void (await show(message, false, opts)),
        confirm: (message, opts) => show(message, true, opts),
    }));

    const close = (ok: boolean) => {
        open?.resolve(ok);
        setOpen(null);
    };

    return (
        <DialogContext.Provider value={api}>
            {children}
            <AlertDialog open={!!open} onOpenChange={(o) => !o && close(false)}>
                <AlertDialogContent className="bg-paper text-ink">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-wide text-xl font-extrabold tracking-[-0.03em]">
                            {open?.title ?? (open?.isConfirm ? "Are you sure?" : "Heads up")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-ink-soft">
                            {open?.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {open?.isConfirm && <AlertDialogCancel>Cancel</AlertDialogCancel>}
                        <AlertDialogAction
                            variant={open?.destructive ? "destructive" : "default"}
                            onClick={() => close(true)}
                        >
                            {open?.confirmLabel ?? "OK"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
    return ctx;
}

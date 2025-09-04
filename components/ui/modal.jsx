"use client";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open) return;
        const onEsc = (e) => e.key === "Escape" && onClose?.();
        document.addEventListener("keydown", onEsc);
        document.body.style.overflow = open ? "hidden" : "auto";
        return () => {
            document.removeEventListener("keydown", onEsc);
            document.body.style.overflow = "auto";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* dialog */}
            <div className="relative z-[61] w-full max-w-lg rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="px-4 py-4">{children}</div>
            </div>
        </div>
    );
}

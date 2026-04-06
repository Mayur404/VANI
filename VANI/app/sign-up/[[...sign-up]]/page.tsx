'use client'

import { SignUp, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function Page() {
    const { isLoaded, isSignedIn } = useUser();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            window.location.replace("/home");
        }
    }, [isLoaded, isSignedIn]);

    if (!isLoaded) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-black text-white">
                Loading...
            </div>
        );
    }

    if (isSignedIn) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-black text-white">
                Redirecting...
            </div>
        );
    }

    return (
        <div className="text-blue-400 h-screen w-full flex items-center justify-center">
            <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                appearance={{
                    variables: {
                        colorPrimary: "#14b8a6",
                        colorBackground: "#1a1a1a",
                        colorText: "#ffffff",
                        borderRadius: "12px",
                    },
                    elements: {
                        card: "bg-[#1a1a1a] shadow-2xl border ",
                        headerTitle: "text-2xl font-bold text-white",
                        headerSubtitle: "text-white",
                        formButtonPrimary:
                            "bg-green-500 hover:bg-green-600 text-white font-semibold",
                        formFieldInput:
                            "bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-green-500",
                        socialButtonsBlockButton:
                            "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700",
                        footerActionLink: "text-white hover:text-green-300",
                    },
                }}
            />
        </div>
    );
}

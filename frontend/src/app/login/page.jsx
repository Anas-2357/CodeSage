"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";

export default function LoginPage({ redirectTo = "/spaces" }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordType, setPasswordType] = useState("password");
    const [loading, setLoading] = useState(false);

    const handlePasswordVisibilityClick = () => {
        setPasswordType(passwordType === "password" ? "text" : "password");
    };

    const handleLogin = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const msg = await res.text();
                alert("Login failed: " + msg);
                return;
            }

            router.push(redirectTo);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex justify-center items-center absolute z-100 top-0 left-0 backdrop-blur-sm">
            <div className="h-[500px] w-[400px] bg-[#232323ee] rounded-md backdrop-blur-md flex flex-col justify-center gap-4 px-8">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-2 px-3 py-2 rounded-lg"
                />
                <div className="w-full border-2 rounded-lg flex items-center">
                    <input
                        type={passwordType}
                        placeholder="Password"
                        value={password}
                        disabled={loading}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-3 py-2 w-full"
                    />
                    <button
                        className="p-2 cursor-pointer"
                        onClick={handlePasswordVisibilityClick}
                        disabled={loading}
                    >
                        {passwordType === "password" ? <Eye /> : <EyeClosed />}
                    </button>
                </div>
                <div className="mt-8 flex flex-col justify-between items-center gap-4">
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="border-2 w-full cursor-pointer hover:border-purple-600 transition-all duration-200 text-white text-lg px-8 py-2 rounded-sm"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    <Link
                        href="/signup"
                        className="text-sm hover:underline cursor-pointer"
                    >
                        Don&apos;t have an account? Signup
                    </Link>
                </div>
            </div>
        </div>
    );
}

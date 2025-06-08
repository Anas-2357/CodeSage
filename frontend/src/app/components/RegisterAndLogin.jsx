"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeClosed } from "lucide-react";

export default function RegisterAndLogin({
    redirectTo = "/spaces",
    isLogin = true,
}) {
    const router = useRouter();
    const [loginOrSignup, setLoginOrSignup] = useState(
        isLogin ? "login" : "signup"
    );
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState(""); // for signup
    const [passwordType, setPasswordType] = useState("password");

    const handlePasswordVisibilityClick = () => {
        setPasswordType(passwordType === "password" ? "text" : "password");
    };

    const handleLogin = async () => {
        try {
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
        }
    };

    const handleSignup = async () => {
        try {
            const res = await fetch("http://localhost:8080/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, username, password }),
            });

            if (!res.ok) {
                const msg = await res.text();
                alert("Signup failed: " + msg);
                return;
            }

            router.push(redirectTo);
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    return (
        <div className="w-screen h-screen flex justify-center items-center absolute z-100 top-0 left-0 backdrop-blur-sm">
            <div className="h-[500px] w-[400px] bg-[#232323ee] rounded-md backdrop-blur-md flex flex-col justify-center gap-4 px-8">
                {loginOrSignup === "login" ? (
                    <>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border-2 px-3 py-2 rounded-lg"
                        />
                        <div className="w-full border-2 rounded-lg flex items-center">
                            <input
                                type={passwordType}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="px-3 py-2 w-full"
                            />
                            <button
                                className="p-2 cursor-pointer"
                                onClick={handlePasswordVisibilityClick}
                            >
                                {passwordType === "password" ? (
                                    <Eye />
                                ) : (
                                    <EyeClosed />
                                )}
                            </button>
                        </div>
                        <div className="mt-8 flex flex-col justify-between items-center gap-4">
                            <button
                                onClick={handleLogin}
                                className="border-2 w-full cursor-pointer hover:border-purple-600 transition-all duration-200 text-white text-lg px-8 py-2 rounded-sm"
                            >
                                Login
                            </button>
                            <button
                                className="text-sm hover:underline cursor-pointer"
                                onClick={() => setLoginOrSignup("signup")}
                            >
                                Don&apos;t have an account? Signup
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border-2 px-3 py-2 rounded-lg"
                        />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="border-2 px-3 py-2 rounded-lg"
                        />
                        <div className="w-full border-2 rounded-lg flex items-center">
                            <input
                                type={passwordType}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="px-3 py-2 w-full"
                            />
                            <button
                                className="p-2 cursor-pointer"
                                onClick={handlePasswordVisibilityClick}
                            >
                                {passwordType === "password" ? (
                                    <Eye />
                                ) : (
                                    <EyeClosed />
                                )}
                            </button>
                        </div>
                        <div className="mt-8 flex flex-col justify-between items-center gap-4">
                            <button
                                onClick={handleSignup}
                                className="border-2 w-full cursor-pointer hover:border-purple-600 transition-all duration-200 text-white text-lg px-8 py-2 rounded-sm"
                            >
                                Signup
                            </button>
                            <button
                                className="text-sm hover:underline cursor-pointer"
                                onClick={() => setLoginOrSignup("login")}
                            >
                                Already have an account? Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

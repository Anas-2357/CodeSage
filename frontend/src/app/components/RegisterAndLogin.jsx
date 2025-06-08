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
    const [name, setName] = useState("");
    const [passwordType, setPasswordType] = useState("password");

    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [emailForOtp, setEmailForOtp] = useState("");

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

    const handleSignup = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:8080/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, name, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert("Signup failed: " + (data.error || "Unknown error"));
                return;
            }

            alert("OTP sent to your email. Please verify.");
            setOtpSent(true);
            setEmailForOtp(email);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:8080/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: emailForOtp, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(
                    "OTP verification failed: " +
                        (data.error || "Unknown error")
                );
                return;
            }

            alert("Signup successful!");
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
                {loginOrSignup === "login" && (
                    <>
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
                                disabled={loading}
                                className="border-2 w-full cursor-pointer hover:border-purple-600 transition-all duration-200 text-white text-lg px-8 py-2 rounded-sm"
                            >
                                {loading ? "Logging in..." : "Login"}
                            </button>
                            <button
                                className="text-sm hover:underline cursor-pointer"
                                onClick={() => setLoginOrSignup("signup")}
                                disabled={loading}
                            >
                                Don&apos;t have an account? Signup
                            </button>
                        </div>
                    </>
                )}

                {loginOrSignup === "signup" && !otpSent && (
                    <>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            disabled={loading}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border-2 px-3 py-2 rounded-lg"
                        />
                        <input
                            type="text"
                            placeholder="Username"
                            value={name}
                            disabled={loading}
                            onChange={(e) => setName(e.target.value)}
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
                                disabled={loading}
                                className="border-2 w-full cursor-pointer hover:border-purple-600 transition-all duration-200 text-white text-lg px-8 py-2 rounded-sm"
                            >
                                {loading ? "Sending OTP..." : "Signup"}
                            </button>
                            <button
                                className="text-sm hover:underline cursor-pointer"
                                onClick={() => setLoginOrSignup("login")}
                                disabled={loading}
                            >
                                Already have an account? Login
                            </button>
                        </div>
                    </>
                )}

                {loginOrSignup === "signup" && otpSent && (
                    <>
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            disabled={loading}
                            onChange={(e) => setOtp(e.target.value)}
                            className="border-2 px-3 py-2 rounded-lg"
                        />
                        <div className="mt-8 flex flex-col justify-between items-center gap-4">
                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="border-2 w-full cursor-pointer hover:border-purple-600 transition-all duration-200 text-white text-lg px-8 py-2 rounded-sm"
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>
                            <button
                                className="text-sm hover:underline cursor-pointer"
                                onClick={() => {
                                    setOtpSent(false);
                                    setOtp("");
                                }}
                                disabled={loading}
                            >
                                Resend OTP / Change Email
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

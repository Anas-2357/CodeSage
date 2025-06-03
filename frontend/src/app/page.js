"use client";

import { useState } from "react";

// Utility function to format assistant responses
function formatResponseText(text) {
    return text
        .replace(/- /g, "\n• ")
        .replace(/\*\*(.*?)\*\*/g, (_, match) => `\n\n${match.toUpperCase()}:`)
        .replace(/```[\s\S]*?```/g, (code) => `\n\n${code.trim()}\n\n`)
        .trim();
}

export default function Home() {
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [topK, setTopK] = useState(3);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newMessages = [
            ...messages,
            { role: "user", content: inputValue },
        ];
        setMessages(newMessages);
        setInputValue("");
        setLoading(true);

        try {
            const res = await fetch(
                "https://codesage-production.up.railway.app/query",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        query: inputValue,
                        topK: topK,
                    }),
                }
            );

            const data = await res.json();
            const reply = data.answer || "No response from assistant.";

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: reply },
            ]);
        } catch (err) {
            console.error("Error fetching from backend:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-4 bg-[#121212] text-white">
            <div className="w-full max-w-3xl space-y-6">
                {/* Input Section */}
                <div className="flex items-center">
                    <input
                        className="flex-grow px-4 py-2 border border-gray-700 rounded-sm mr-4 bg-[#1e1e1e] text-white"
                        type="text"
                        placeholder="Ask something about the code..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                        className="bg-[#232323] text-green-400 px-4 py-2 rounded-sm border border-green-700 hover:bg-green-800 hover:text-white transition"
                        onClick={handleSend}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Ask"}
                    </button>
                </div>

                {/* Slider Section */}
                <div className="flex items-center gap-4">
                    <label
                        htmlFor="topKSlider"
                        className="text-sm text-gray-300 w-28"
                    >
                        TopK:{" "}
                        <span className="font-semibold text-white">{topK}</span>
                    </label>
                    <input
                        id="topKSlider"
                        type="range"
                        min="1"
                        max="100"
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                        className="w-full accent-green-500"
                    />
                </div>

                {/* Messages Section */}
                <div className="space-y-4 bg-[#1a1a1a] p-4 rounded shadow max-h-[60vh] overflow-y-auto">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`text-sm ${
                                msg.role === "user" ? "text-right" : "text-left"
                            }`}
                        >
                            <div
                                className={`inline-block p-3 rounded-md max-w-[80%] whitespace-pre-wrap break-words ${
                                    msg.role === "user"
                                        ? "bg-[#333] text-white"
                                        : "bg-[#2a4035] text-green-300"
                                }`}
                            >
                                <strong className="block mb-1">
                                    {msg.role === "user" ? "You" : "AI"}:
                                </strong>
                                {msg.role === "assistant"
                                    ? formatResponseText(msg.content)
                                    : msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

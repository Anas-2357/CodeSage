"use client";
import { X } from "lucide-react";
import { useState } from "react";

export const CreateSpace = ({ setCreateSpace }) => {
    const [repoUrl, setRepoUrl] = useState("");
    const [spaceName, setSpaceName] = useState("");
    const [dryRunResult, setDryRunResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [message, setMessage] = useState("");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const handleDryRun = async () => {
        if (!repoUrl.trim() || !spaceName.trim()) {
            setMessage("❌ Please fill in both Repo URL and Space Name.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(`${apiUrl}/repo/ingest`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repoUrl,
                    spaceName,
                    dryrun: true,
                }),
            });

            const data = await res.json();
            console.log(data);
            setDryRunResult(data);
        } catch (err) {
            setMessage("❌ Dry run failed. Check console.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmIngest = async () => {
        setConfirming(true);
        setMessage("");
        try {
            const res = await fetch(`${apiUrl}/repo/ingest`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repoUrl,
                    spaceName,
                    dryrun: false,
                }),
            });

            const data = await res.json();
            setMessage(data.message || "✅ Ingestion complete");
        } catch (err) {
            setMessage("❌ Ingestion failed. Check console.");
            console.error(err);
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center backdrop-blur-sm">
            <div className="w-xl mx-auto p-4 bg-[#232323] rounded-xl shadow flex flex-col items-center gap-4">
                <div className="flex justify-between w-full">
                    <h2 className="text-xl font-semibold mb-4">
                        Ingest Git Repository
                    </h2>
                    <button
                        onClick={() => {
                            setCreateSpace(false);
                        }}
                        className="cursor-pointer flex"
                    >
                        <X />
                    </button>
                </div>

                <input
                    className="w-full border px-3 py-2 rounded"
                    type="text"
                    placeholder="Repo URL"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={dryRunResult !== null}
                />

                <input
                    className="w-full border px-3 py-2 rounded"
                    type="text"
                    placeholder="Space Name"
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    disabled={dryRunResult !== null}
                />

                <button
                    onClick={handleDryRun}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
                >
                    {loading ? "Running dry run..." : "Check Cost Estimate"}
                </button>

                {dryRunResult && (
                    <div className="mt-4 p-4 rounded border flex flex-col items-center gap-2">
                        <p>{dryRunResult.message}</p>
                        {dryRunResult.estimatedTokenCount && (
                            <>
                                <p>
                                    Estimated Tokens:{" "}
                                    <strong>
                                        {dryRunResult.estimatedTokenCount}
                                    </strong>
                                </p>
                                <p>Total Files: {dryRunResult.totalFiles}</p>
                                <p>
                                    Available Tokens:{" "}
                                    {dryRunResult.availableTokens}
                                </p>
                                <button
                                    onClick={handleConfirmIngest}
                                    disabled={confirming}
                                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    {confirming
                                        ? "Ingesting..."
                                        : "Confirm & Ingest"}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {message && (
                    <div className="mt-4 p-3 bg-amber-800 border rounded">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

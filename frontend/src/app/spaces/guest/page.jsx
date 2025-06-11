"use client";
import { useEffect, useState } from "react";
import SpacesListItem from "../../containers/SpacesListItem";

function Page() {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                const res = await fetch(`${apiUrl}/spaces/guest`);

                const json = await res.json();
                setSpaces(json.spaces);
            } catch (err) {
                console.error("Failed to fetch spaces:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpaces();
    }, []);

    if (loading)
        return (
            <div className="h-screen w-screen flex justify-center items-center">
                <p className="text-2xl">Loading spaces...</p>
            </div>
        );

    return (
        <div className="flex h-screen w-screen justify-center items-center overflow-hidden">
            <div className="h-[80vh] w-[50vw] flex flex-col gap-6 p-8 border-2 border-gray-800 rounded-md">
                <h1 className="text-4xl">Spaces</h1>

                {loading ? (
                    <div className="text-center text-gray-500">Loading...</div>
                ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto">
                        {spaces.map((object, index) => (
                            <SpacesListItem
                                key={index}
                                spaceName={object.spaceName}
                                repoUrl={object.repoUrl}
                                isPublic={object.isPublic}
                                spaceId={object.spaceId}
                                redirectTo={"/spaces/guest"}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Page;

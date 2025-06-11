"use client";

import Link from "next/link";

export default function Page() {
    return (
        <div className="h-screen bg-linear-to-t from-[#fd9791] to-[#8657fa] font-poppins pb-[60px] px-[60px]">
            <div className="h-full w-full flex flex-col justify-center items-center gap-4 rounded-b-[100px] bg-black">
                <h1 className="text-6xl/18 font-[500] text-center text-white">
                    Understand Codebases via Q&A
                    <br />
                    and Visual Maps
                </h1>
                <h2 className="text-gray-400 w-[600px] text-center">
                    Paste a GitHub repo link, ask questions about the code, and
                    visualize the logic and data flow with interactive flow
                    charts.
                </h2>
                <div className="flex gap-6 mt-6">
                    <Link
                        href="/spaces"
                        className="bg-linear-to-r hover:scale-105 focus:scale-95 transition-all duration-200 font-semibold font from-[#fd3e42] to-[#8657fa] text-w px-6 py-3 rounded-md mt-2 cursor-pointer"
                    >
                        Go to spaces
                    </Link>
                    <Link
                        href="/spaces/guest"
                        className="bg-linear-to-r hover:scale-105 focus:scale-95 transition-all duration-200 font-semibold font from-[#fd3e42] to-[#8657fa] text-w px-6 py-3 rounded-md mt-2 cursor-pointer"
                    >
                        Try as guest
                    </Link>
                </div>
            </div>
        </div>
    );
}

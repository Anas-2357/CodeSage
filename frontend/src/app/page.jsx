"use client";

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
                <button className="bg-linear-to-r font-semibold font from-[#fd3e42] to-[#8657fa] text-w px-4 py-2 rounded-md mt-2 cursor-pointer">
                    Try as guest
                </button>
            </div>
        </div>
    );
}

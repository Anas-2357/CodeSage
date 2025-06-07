import SpacesListItem from "../containers/SpacesListItem";

const data = [
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: false,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
    {
        repoUrl: "https://github.com/Anas-2357/Script-Type",
        spaceName: "Good Space",
        isPublic: true,
    },
];

function Page() {
    return (
        <div className="flex h-screen w-screen justify-center items-center overflow-hidden">
            <div className="h-[80vh] w-[50vw] flex flex-col gap-6 p-8 border-2 border-gray-800 rounded-md">
                <h1 className="text-4xl">Spaces</h1>
                <div className="flex flex-col gap-2 overflow-y-scroll">
                    {data.map((object, index) => (
                        <SpacesListItem
                            key={index}
                            spaceName={object.spaceName}
                            repoUrl={object.repoUrl}
                            isPublic={object.isPublic}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Page;

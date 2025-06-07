import React from "react";

function SpacesListItem({ spaceName, repoUrl, isPublic }) {
    return (
        <div className="py-4 px-6 border-1 rounded-md border-gray-800 hover:border-gray-400 transition-all duration-300 cursor-pointer mr-3">
            <div className="flex justify-between">
                <p className="mb-1 text-lg">{spaceName}</p>
                {
                    isPublic ? <p className="text-green-500">Public</p> : <p className="text-blue-300">Private</p>
                }
            </div>
            <p className="text-gray-500">{repoUrl}</p>
        </div>
    );
}

export default SpacesListItem;

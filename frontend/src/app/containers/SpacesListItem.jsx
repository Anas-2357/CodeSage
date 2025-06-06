import React from 'react'

function SpacesListItem({spaceName, repoUrl}) {
  return (
    <div className='py-4 px-6 border-1 rounded-md border-gray-800 hover:border-gray-400 transition-all duration-300 cursor-pointer'>
        <p className='mb-1'>{spaceName}</p>
        <p className='text-gray-500'>{repoUrl}</p>
    </div>
  )
}

export default SpacesListItem
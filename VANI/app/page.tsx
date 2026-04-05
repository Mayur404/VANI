import { prisma } from '@/lib/prisma'
import { getAllUsers } from '@/lib/services/userprofile.service'
import React from 'react'

const page = async () => {
    const userNames = await getAllUsers();
    return (<>
        <div className='text-6xl p-4 font-oxanium'>{userNames.map((user, index) => (
            <h1 key={index}>{user.name}</h1>
        ))}</div>

    </>
    )
}

export default page

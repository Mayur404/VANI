'use client'

import { Bell } from 'lucide-react'
import { InputGroupDemo } from './Searchbar'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

const Navbar = () => {
    const { isLoaded, isSignedIn } = useUser()

    return (
        <div>
            <nav className='h-16 w-full flex items-center justify-center'>
                <div className='w-full h-full p-3'>
                    {/* <div className='w-1/2 h-full rounded-2xl flex items-center bg-[#080708] border border-[#19171a]'>
                        <Search size={18} className='text-white m-4' />
                        <h3 className='font-medium text-gray-500'>search or press ctrl + k</h3>
                    </div> */}
                    <InputGroupDemo />
                </div>
                <div className='w-full h-full flex items-center justify-end'>
                    <div className="border w-fit rounded-full mx-4 ">
                        <Bell size={18} className="text-white m-2" />
                    </div>
                    {isLoaded && !isSignedIn ? (
                        <div className="mx-4 flex items-center gap-3">
                            <SignInButton>
                                <button className="text-sm text-[#8B8B8B] hover:text-white transition-colors duration-200">
                                    Log in
                                </button>
                            </SignInButton>
                            <SignUpButton>
                                <button className="text-sm font-medium bg-white text-[#0A0A0A] px-4 py-1.5 rounded-full hover:scale-[1.02] transition-transform duration-200">
                                    Sign up
                                </button>
                            </SignUpButton>
                        </div>
                    ) : null}
                    {isLoaded && isSignedIn ? (
                        <div className="mx-4">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    ) : null}
                </div>
            </nav>
        </div>
    )
}

export default Navbar

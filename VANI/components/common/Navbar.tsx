import { Search, Bell, HatGlasses } from 'lucide-react'
import { InputGroupDemo } from './Searchbar'

const Navbar = () => {
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
                    <div className='border w-fit rounded-full mx-4 bg-white'>
                        <HatGlasses size={18} className='text-black m-2' />
                    </div>
                </div>
            </nav>
        </div>
    )
}

export default Navbar

'use client'
import { DatePickerWithRange } from "@/components/dashboard/DatePicker"
import { SelectDemo } from "@/components/dashboard/DomainFilder";

import { useDashboardRangeSelector } from "@/store/useRecordingStore";


const DashboardHero = () => {
    const range = useDashboardRangeSelector((state) => state.range);
    const setRange = useDashboardRangeSelector((state) => state.setRange);

    return (
        <div className="w-full h-full flex items-center justify-center gap-4 py-4 px-2">
            {/* Title */}
            <div className='h-full w-1/3 flex items-center justify-start p-4'>
                <h1 className='text-4xl font-semibold text-white' style={{ fontFamily: "Outfit" }}>ANALYTICS DASHBOARD</h1>
            </div>
            {/* Range Selector */}
            <div className='h-full w-1/3 flex items-center justify-center p-1'>
                <div className="h-full w-2/3 bg-black rounded-2xl border-2 border-white flex">
                    <div className={`h-full w-1/3 border-r-2 border-white rounded-l-xl flex items-center justify-center hover:bg-[#f1f1f1] hover:text-black ${range === 7 ? "bg-[#f1f1f1] text-black" : "text-white"}`}
                        onClick={() => setRange(7)}>
                        <h1 className='text-md font-medium m-4'>7 DAYS</h1>
                    </div>
                    <div className={`h-full w-1/3 border-r-2 border-white flex items-center justify-center hover:bg-[#f1f1f1] hover:text-black ${range === 30 ? "bg-[#f1f1f1] text-black" : "text-white"}`}
                        onClick={() => setRange(30)}>
                        <h1 className='text-md font-medium m-4'>30 DAYS</h1>
                    </div>
                    <div className={`h-full w-1/3  border-white rounded-r-xl flex items-center justify-center hover:bg-[#f1f1f1] hover:text-black ${range === 90 ? "bg-[#f1f1f1] text-black" : "text-white"}`}
                        onClick={() => setRange(90)}>
                        <h1 className='text-md font-medium m-4'>90 DAYS</h1>
                    </div>
                </div>
            </div>
            {/* Specific Range and Domain Filter */}
            <div className='h-full w-1/3 flex items-center justify-center gap-4 p-2'>
                <div className='h-full w-1/2  flex items-center justify-center rounded-xl'>
                    <DatePickerWithRange />
                </div>
                <div className='h-full w-1/2 flex items-center justify-center rounded-xl'>
                    <SelectDemo />
                </div>
            </div>
        </div>
    )
}

export default DashboardHero

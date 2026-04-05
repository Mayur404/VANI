import { getPatientAlerts, getPatientMedicalSummary, getPatientProfile, getPatientVisitTimeline, getPatientReferrals } from "@/lib/services/userprofile.service";
import { PencilLine, PhoneForwarded } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


const UserProfilePage = async () => {
    const userId = 2;
    const patientProfile = await getPatientProfile(userId);
    const patientMedicalSummary = await getPatientMedicalSummary(userId)
    const patientAlerts = await getPatientAlerts(userId)
    const patientVisitTimeline = await getPatientVisitTimeline(userId);
    const patientReferrals = await getPatientReferrals(userId)
    const initiateCallHref = `/call?${new URLSearchParams({
        name: patientProfile?.name ?? "Unknown patient",
        id: patientProfile?.insurance_id ?? String(userId),
        phone: patientProfile?.phone_number ?? "",
        domain: "healthcare",
        amount: "0",
        bank: patientProfile?.sessions[0]?.users?.organisation ?? "VANI Care",
        agent: patientProfile?.sessions[0]?.users?.name ?? "Assigned doctor",
    }).toString()}`;

    return (
        <div className='h-[95vh] w-full flex flex-col bg-black'>
            <div className='h-full w-full flex flex-col items-center justify-center'>
                {/* Basic Info */}
                <div className='w-full h-2/8  flex gap-4 p-4'>
                    {/* Profile Pic */}
                    <div className='h-full w-1/6 rounded-2xl flex items-center justify-center '>
                        <div className='relative w-fit h-fit p-2'>
                            <Image src="/profilepic.png" alt="profile image" className='object-cover rounded-full scale-125' width={150} height={150} loading="eager" />
                            <div className='absolute h-6 w-6 bg-green-500 bottom-0 right-0 rounded-full '></div>
                        </div>
                    </div>
                    {/* Info */}
                    <div className='h-full w-2/6 rounded-2xl flex gap-4 p-4 items-center justify-start'>
                        <div>
                            <div>
                                <h1 className='text-4xl font-semibold text-white mt-4'>{patientProfile?.name}</h1>
                            </div>
                            <div>
                                <div className='flex items-center gap-4'>
                                    <h1 className="text-xl font-semibold text-white"> ID : <span className="text-[#9d9d9d]">{patientProfile?.insurance_id}</span></h1>
                                    <h1 className="text-xl font-semibold text-white"> LAST VISIT :  <span className="text-[#9d9d9d]">{patientProfile?.sessions[0].completed_at?.toDateString()}</span></h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pt-4">
                                <div className="h-fit w-fit bg-red-500/50 rounded-xl text-white px-4">{patientProfile?.healthcare_reports[0].severity?.toLocaleUpperCase()}</div>
                                <div className="h-fit w-fit bg-blue-500/50 rounded-xl text-white px-4">{patientProfile?.healthcare_reports[0].visit_type?.toLocaleUpperCase()}</div>
                            </div>
                        </div>
                    </div>
                    <div className='h-full w-1/6'></div>
                    {/* Action Buttons */}
                    <div className='h-full w-2/6 rounded-2xl flex items-end justify-end gap-4 p-4'>
                        <div className='w-full h-1/3 rounded-2xl'>
                            <button
                                className={`w-full py-3 rounded-xl text-xl font-semibold font-outfit
                       text-white hover:scale-105 transition-all duration-200 mt-2 bg-[#2c2c2c] flex items-center justify-center gap-4`}>
                                <PencilLine />
                                Modify Profile
                            </button>
                        </div>
                        <div className='w-full h-1/3 rounded-2xl'>
                            <Link
                                href={initiateCallHref}
                                className={`w-full py-3 rounded-xl text-xl font-semibold font-outfit
                       text-white hover:scale-105 transition-all duration-200 mt-2 bg-[#2b7fff] flex items-center justify-center gap-4`}>
                                <PhoneForwarded />
                                Initiate Call
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Actual Stuff */}
                <div className='w-full h-5/8  p-4 flex flex-col gap-4'>
                    {/* Menu */}
                    <div className='w-full h-16 rounded-2xl flex items-center justify-start gap-4'>
                        <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span className="border-b-4 border-white p-2">OVERVIEW</span></div>
                        <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span >VISIT HISTORY</span></div>
                        <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span>REPORTS</span></div>
                        <div className="relative h-full w-fit p-4 text-xl font-semibold text-white"><span>ALERTS</span>
                            {patientAlerts && <div className='absolute h-2 w-2 rounded-full bg-teal-500 top-2 right-2'></div>}
                        </div>
                        <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span>MONITORING</span></div>

                    </div>
                    {/* DETAILS SECTION  ( when menu changes , this chuck has to change)*/}
                    <div className='w-full h-full flex gap-4'>
                        {/* Medical Summary */}
                        <div className='h-full w-2/3 bg-[#0a0a0a] rounded-2xl flex flex-col overflow-y-auto'>
                            <div className=" w-full h-fit">
                                <h1 className='text-2xl font-semibold text-white m-4'>MEDICAL SUMMARY</h1>
                            </div>
                            <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-2 p-4">
                                {/* Data Grid */}
                                {patientMedicalSummary?.summaryCards.map((item, index) => (
                                    <div key={index} className="col-span-1 row-span-1 bg-[#1a1a1a] p-2 rounded-xl overflow-y-hidden">
                                        <div className="h-1/2 w-full py-4">
                                            <h1 className="text-[#f1f1f1] text-xl font-semibold">{item.title}</h1>
                                        </div>
                                        <div className={`w-full text-white text-md bg-[#2c2c2c] p-2 rounded-xl ${((item.description ?? "").length < 50) ? 'h-1/2' : 'h-fit'}`}>
                                            <p>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {/* Active Medication */}
                                <div className="col-span-4 row-span-1 bg-[#1a1a1a] p-2 rounded-xl">
                                    <div className="h-fit w-full pb-2 px-2">
                                        <h1 className="text-[#f1f1f1] text-xl font-semibold">ACTIVE MEDICATIONS</h1>
                                    </div>
                                    <div className="w-full h-fit flex gap-2">
                                        {patientMedicalSummary?.activeMedications.map((medication, index) => (
                                            <div key={index} className="bg-[#2c2c2c] p-4 rounded-xl mt-2">
                                                <h2 className="text-lg font-semibold text-white">{medication.name}</h2>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Risk Indicators */}
                                <div className="col-span-4 row-span-1 bg-[#1a1a1a] p-2 rounded-xl">
                                    <div className='h-fit w-full pb-2 px-2'>
                                        <h1 className="text-[#f1f1f1] text-xl font-semibold">RISK INDICATORS</h1>
                                    </div>
                                    <div className='h-fit w-full flex gap-2'>
                                        {patientMedicalSummary?.riskIndicators.map((indicator, index) => (
                                            <div key={index} className="bg-[#2c2c2c] p-4 rounded-xl">
                                                <h2 className="text-lg font-semibold text-white">{indicator.flag}</h2>
                                                <p className="text-gray-300">{indicator.severity}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Referrals */}
                        <div className='h-full w-1/3 bg-[#0a0a0a] rounded-2xl'>
                            <div className=" w-full h-fit">
                                <h1 className='text-2xl font-semibold text-white m-4'>CARE COORDINATION</h1>
                            </div>
                            <div className="w-full h-full flex flex-col gap-8 p-4">
                                <div className="w-full h-7/8 bg-[#1a1a1a] rounded-xl flex flex-col gap-4 p-4">
                                    <div className="h-fit w-full pb-2 px-2">
                                        <h1 className="text-[#f1f1f1] text-xl font-semibold">ACTIVE REFERRALS</h1>
                                    </div>
                                    {patientReferrals.map((referral, index) => (
                                        <div key={index} className="w-full h-1/4 rounded-xl bg-[#2c2c2c] flex p-2">
                                            <div className="h-full w-2/3">
                                                <div className="flex items-center gap-2">
                                                    <h1 className="text-white text-xl">{referral.doctorName}</h1>
                                                    <p className="text-[#9d9d9d] text-lg">{referral.createdAt?.toDateString()}</p>
                                                </div>
                                                <p className="my-2 text-md">{referral.reason}</p>
                                            </div>
                                            <div className="h-full w-1/3 flex items-center justify-center gap-4 p-4">
                                                <span className="bg-green-500/30 text-green-400 p-1 rounded-xl">{referral.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* TimeLine */}
                <div className='w-full h-1/8 p-4'>
                    <div className='h-full w-full bg-[#0a0a0a] rounded-2xl flex items-center px-8 py-6'>
                        <div className='relative w-full flex items-center'>

                            {/* Horizontal line */}
                            <div className='absolute top-1 left-0 right-0 h-px bg-[#9d9d9d]' />

                            {/* Dots + dates */}
                            <div className='relative w-full flex items-center justify-between'>
                                {patientVisitTimeline.map((visit, index) => (
                                    <div key={index} className='flex flex-col items-center gap-2'>

                                        {/* Dot */}
                                        <div className='h-3 w-3 bg-white rounded-full ring-2 ring-[#1a1a1a] shrink-0' />

                                        {/* Always-visible date */}
                                        <span className='text-[#dbdbdb] text-xs font-medium whitespace-nowrap'>
                                            {visit.completed_at?.toDateString()}
                                        </span>

                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfilePage

import {
  getPatientProfile,
  getPatientAlerts,
  getPatientMedicalSummary,
  getPatientVisitTimeline,
  getPatientReferrals,
  getCustomerProfile,
  getCustomerFinancialSummary,
  getCustomerCallTimeline,
  getCustomerAlerts,
} from "@/lib/services/userprofile.service";
import { PencilLine, PhoneForwarded } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ domain?: string; id?: string }>;
};

const UserProfilePage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const domain = params.domain === "finance" ? "finance" : "healthcare";
  const subjectId = Number(params.id) || 2;

  if (domain === "finance") {
    return <FinanceProfileView customerId={subjectId} />;
  }

  return <HealthcareProfileView patientId={subjectId} />;
};

// ─── HEALTHCARE VIEW ─────────────────────────────────────

const HealthcareProfileView = async ({ patientId }: { patientId: number }) => {
  const patientProfile = await getPatientProfile(patientId);
  const patientMedicalSummary = await getPatientMedicalSummary(patientId);
  const patientAlerts = await getPatientAlerts(patientId);
  const patientVisitTimeline = await getPatientVisitTimeline(patientId);
  const patientReferrals = await getPatientReferrals(patientId);

  const initiateCallHref = `/call?${new URLSearchParams({
    name: patientProfile?.name ?? "Unknown patient",
    id: patientProfile?.insurance_id ?? String(patientId),
    phone: patientProfile?.phone_number ?? "",
    domain: "healthcare",
    amount: "0",
    bank: patientProfile?.sessions[0]?.users?.organisation ?? "VANI Care",
    agent: patientProfile?.sessions[0]?.users?.name ?? "Assigned doctor",
  }).toString()}`;

  return (
    <div className="h-[95vh] w-full flex flex-col bg-black">
      <div className="h-full w-full flex flex-col items-center justify-center">
        {/* Basic Info */}
        <div className="w-full h-2/8 flex gap-4 p-4">
          <div className="h-full w-1/6 rounded-2xl flex items-center justify-center">
            <div className="relative w-fit h-fit p-2">
              <Image src="/profilepic.png" alt="profile image" className="object-cover rounded-full scale-125" width={150} height={150} loading="eager" />
              <div className="absolute h-6 w-6 bg-green-500 bottom-0 right-0 rounded-full"></div>
            </div>
          </div>
          <div className="h-full w-2/6 rounded-2xl flex gap-4 p-4 items-center justify-start">
            <div>
              <div>
                <h1 className="text-4xl font-semibold text-white mt-4">{patientProfile?.name}</h1>
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold text-white"> ID : <span className="text-[#9d9d9d]">{patientProfile?.insurance_id}</span></h1>
                  <h1 className="text-xl font-semibold text-white"> LAST VISIT : <span className="text-[#9d9d9d]">{patientProfile?.sessions[0]?.completed_at?.toDateString()}</span></h1>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4">
                {patientProfile?.healthcare_reports[0]?.severity && (
                  <div className="h-fit w-fit bg-red-500/50 rounded-xl text-white px-4">{patientProfile.healthcare_reports[0].severity.toLocaleUpperCase()}</div>
                )}
                {patientProfile?.healthcare_reports[0]?.visit_type && (
                  <div className="h-fit w-fit bg-blue-500/50 rounded-xl text-white px-4">{patientProfile.healthcare_reports[0].visit_type.toLocaleUpperCase()}</div>
                )}
              </div>
            </div>
          </div>
          <div className="h-full w-1/6"></div>
          <div className="h-full w-2/6 rounded-2xl flex items-end justify-end gap-4 p-4">
            <div className="w-full h-1/3 rounded-2xl">
              <button className="w-full py-3 rounded-xl text-xl font-semibold font-outfit text-white hover:scale-105 transition-all duration-200 mt-2 bg-[#2c2c2c] flex items-center justify-center gap-4">
                <PencilLine />
                Modify Profile
              </button>
            </div>
            <div className="w-full h-1/3 rounded-2xl">
              <Link
                href={initiateCallHref}
                className="w-full py-3 rounded-xl text-xl font-semibold font-outfit text-white hover:scale-105 transition-all duration-200 mt-2 bg-teal-600 flex items-center justify-center gap-4"
              >
                <PhoneForwarded />
                Initiate Call
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full h-5/8 p-4 flex flex-col gap-4">
          <div className="w-full h-16 rounded-2xl flex items-center justify-start gap-4">
            <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span className="border-b-4 border-teal-500 p-2">OVERVIEW</span></div>
            <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span>VISIT HISTORY</span></div>
            <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span>REPORTS</span></div>
            <div className="relative h-full w-fit p-4 text-xl font-semibold text-white">
              <span>ALERTS</span>
              {patientAlerts && patientAlerts.length > 0 && <div className="absolute h-2 w-2 rounded-full bg-teal-500 top-2 right-2"></div>}
            </div>
            <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span>MONITORING</span></div>
          </div>

          <div className="w-full h-full flex gap-4">
            {/* Medical Summary */}
            <div className="h-full w-2/3 bg-[#0a0a0a] rounded-2xl flex flex-col overflow-y-auto">
              <div className="w-full h-fit">
                <h1 className="text-2xl font-semibold text-white m-4">MEDICAL SUMMARY</h1>
              </div>
              <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-2 p-4">
                {patientMedicalSummary?.summaryCards.map((item, index) => (
                  <div key={index} className="col-span-1 row-span-1 bg-[#1a1a1a] p-2 rounded-xl overflow-y-hidden">
                    <div className="h-1/2 w-full py-4">
                      <h1 className="text-[#f1f1f1] text-xl font-semibold">{item.title}</h1>
                    </div>
                    <div className={`w-full text-white text-md bg-[#2c2c2c] p-2 rounded-xl ${((item.description ?? "").length < 50) ? "h-1/2" : "h-fit"}`}>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
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
                <div className="col-span-4 row-span-1 bg-[#1a1a1a] p-2 rounded-xl">
                  <div className="h-fit w-full pb-2 px-2">
                    <h1 className="text-[#f1f1f1] text-xl font-semibold">RISK INDICATORS</h1>
                  </div>
                  <div className="h-fit w-full flex gap-2">
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
            <div className="h-full w-1/3 bg-[#0a0a0a] rounded-2xl">
              <div className="w-full h-fit">
                <h1 className="text-2xl font-semibold text-white m-4">CARE COORDINATION</h1>
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

        {/* Timeline */}
        <div className="w-full h-1/8 p-4">
          <div className="h-full w-full bg-[#0a0a0a] rounded-2xl flex items-center px-8 py-6">
            <div className="relative w-full flex items-center">
              <div className="absolute top-1 left-0 right-0 h-px bg-[#9d9d9d]" />
              <div className="relative w-full flex items-center justify-between">
                {patientVisitTimeline.map((visit, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="h-3 w-3 bg-white rounded-full ring-2 ring-[#1a1a1a] shrink-0" />
                    <span className="text-[#dbdbdb] text-xs font-medium whitespace-nowrap">
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
  );
};

// ─── FINANCE VIEW ────────────────────────────────────────

const FinanceProfileView = async ({ customerId }: { customerId: number }) => {
  const customerProfile = await getCustomerProfile(customerId);
  const financialSummary = await getCustomerFinancialSummary(customerId);
  const callTimeline = await getCustomerCallTimeline(customerId);
  const customerAlerts = await getCustomerAlerts(customerId);

  if (!customerProfile) {
    return (
      <div className="h-[95vh] w-full flex items-center justify-center bg-black">
        <p className="text-[#9d9d9d] text-2xl">Customer not found (ID: {customerId})</p>
      </div>
    );
  }

  const initiateCallHref = `/call?${new URLSearchParams({
    name: customerProfile.name,
    id: customerProfile.loan_account_number ?? String(customerId),
    phone: customerProfile.phone_number ?? "",
    domain: "finance",
    amount: String(customerProfile.outstanding_amount?.toNumber() ?? 0),
    bank: "VANI Finance",
    agent: customerProfile.sessions[0]?.users?.name ?? "VANI Agent",
  }).toString()}`;

  return (
    <div className="h-[95vh] w-full flex flex-col bg-black">
      <div className="h-full w-full flex flex-col items-center justify-center">
        {/* Basic Info */}
        <div className="w-full h-2/8 flex gap-4 p-4">
          <div className="h-full w-1/6 rounded-2xl flex items-center justify-center">
            <div className="relative w-fit h-fit p-2">
              <div className="w-36 h-36 rounded-full bg-[#1a1a1a] border-4 border-amber-500/50 flex items-center justify-center">
                <span className="text-4xl font-bold text-amber-500">
                  {customerProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="absolute h-6 w-6 bg-amber-500 bottom-0 right-0 rounded-full"></div>
            </div>
          </div>
          <div className="h-full w-2/6 rounded-2xl flex gap-4 p-4 items-center justify-start">
            <div>
              <div>
                <h1 className="text-4xl font-semibold text-white mt-4">{customerProfile.name}</h1>
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold text-white"> LOAN A/C : <span className="text-[#9d9d9d]">{customerProfile.loan_account_number}</span></h1>
                  <h1 className="text-xl font-semibold text-white"> DUE DATE : <span className="text-[#9d9d9d]">{customerProfile.due_date?.toDateString()}</span></h1>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="h-fit w-fit bg-amber-500/50 rounded-xl text-white px-4">
                  ₹{customerProfile.outstanding_amount?.toNumber().toLocaleString("en-IN") ?? "0"} OUTSTANDING
                </div>
                {financialSummary?.report?.payment_status && (
                  <div className={`h-fit w-fit rounded-xl text-white px-4 ${
                    financialSummary.report.payment_status === "paid" ? "bg-green-500/50" :
                    financialSummary.report.payment_status === "partial" ? "bg-blue-500/50" :
                    financialSummary.report.payment_status === "promised" ? "bg-yellow-500/50" :
                    "bg-red-500/50"
                  }`}>
                    {financialSummary.report.payment_status.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="h-full w-1/6"></div>
          <div className="h-full w-2/6 rounded-2xl flex items-end justify-end gap-4 p-4">
            <div className="w-full h-1/3 rounded-2xl">
              <button className="w-full py-3 rounded-xl text-xl font-semibold font-outfit text-white hover:scale-105 transition-all duration-200 mt-2 bg-[#2c2c2c] flex items-center justify-center gap-4">
                <PencilLine />
                Modify Profile
              </button>
            </div>
            <div className="w-full h-1/3 rounded-2xl">
              <Link
                href={initiateCallHref}
                className="w-full py-3 rounded-xl text-xl font-semibold font-outfit text-white hover:scale-105 transition-all duration-200 mt-2 bg-amber-600 flex items-center justify-center gap-4"
              >
                <PhoneForwarded />
                Initiate Call
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full h-5/8 p-4 flex flex-col gap-4">
          <div className="w-full h-16 rounded-2xl flex items-center justify-start gap-4">
            <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span className="border-b-4 border-amber-500 p-2">OVERVIEW</span></div>
            <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span>CALL HISTORY</span></div>
            <div className="h-full w-fit p-4 text-xl font-semibold text-white"><span>REPORTS</span></div>
            <div className="relative h-full w-fit p-4 text-xl font-semibold text-white">
              <span>ALERTS</span>
              {customerAlerts && customerAlerts.length > 0 && <div className="absolute h-2 w-2 rounded-full bg-amber-500 top-2 right-2"></div>}
            </div>
          </div>

          <div className="w-full h-full flex gap-4">
            {/* Financial Summary */}
            <div className="h-full w-2/3 bg-[#0a0a0a] rounded-2xl flex flex-col overflow-y-auto">
              <div className="w-full h-fit">
                <h1 className="text-2xl font-semibold text-white m-4">FINANCIAL SUMMARY</h1>
              </div>
              <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-2 p-4">
                {financialSummary?.summaryCards.map((item, index) => (
                  <div key={index} className="col-span-1 row-span-1 bg-[#1a1a1a] p-2 rounded-xl overflow-y-hidden">
                    <div className="h-1/2 w-full py-4">
                      <h1 className="text-[#f1f1f1] text-xl font-semibold">{item.title}</h1>
                    </div>
                    <div className={`w-full text-white text-md bg-[#2c2c2c] p-2 rounded-xl ${((item.description ?? "").length < 50) ? "h-1/2" : "h-fit"}`}>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
                <div className="col-span-4 row-span-1 bg-[#1a1a1a] p-2 rounded-xl">
                  <div className="h-fit w-full pb-2 px-2">
                    <h1 className="text-[#f1f1f1] text-xl font-semibold">PAYMENT DETAILS</h1>
                  </div>
                  <div className="w-full h-fit flex gap-2">
                    {financialSummary?.paymentHistory.map((detail, index) => (
                      <div key={index} className="bg-[#2c2c2c] p-4 rounded-xl mt-2 flex-1">
                        <h2 className="text-sm text-[#9d9d9d]">{detail.label}</h2>
                        <p className="text-lg font-semibold text-white mt-1">{detail.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-4 row-span-1 bg-[#1a1a1a] p-2 rounded-xl">
                  <div className="h-fit w-full pb-2 px-2">
                    <h1 className="text-[#f1f1f1] text-xl font-semibold">RISK INDICATORS</h1>
                  </div>
                  <div className="h-fit w-full flex gap-2">
                    {financialSummary?.riskIndicators.map((indicator, index) => (
                      <div key={index} className={`p-4 rounded-xl ${
                        indicator.severity === "High" ? "bg-red-500/20 border border-red-500/30" :
                        indicator.severity === "Moderate" ? "bg-amber-500/20 border border-amber-500/30" :
                        "bg-green-500/20 border border-green-500/30"
                      }`}>
                        <h2 className="text-lg font-semibold text-white">{indicator.flag}</h2>
                        <p className={`${
                          indicator.severity === "High" ? "text-red-400" :
                          indicator.severity === "Moderate" ? "text-amber-400" :
                          "text-green-400"
                        }`}>{indicator.severity}</p>
                      </div>
                    ))}
                    {(!financialSummary?.riskIndicators || financialSummary.riskIndicators.length === 0) && (
                      <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-xl">
                        <h2 className="text-lg font-semibold text-green-400">No Risk Flags</h2>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled Calls */}
            <div className="h-full w-1/3 bg-[#0a0a0a] rounded-2xl">
              <div className="w-full h-fit">
                <h1 className="text-2xl font-semibold text-white m-4">SCHEDULED CALLS</h1>
              </div>
              <div className="w-full h-full flex flex-col gap-4 p-4">
                <div className="w-full h-7/8 bg-[#1a1a1a] rounded-xl flex flex-col gap-4 p-4 overflow-y-auto">
                  <div className="h-fit w-full pb-2 px-2">
                    <h1 className="text-[#f1f1f1] text-xl font-semibold">UPCOMING & PAST</h1>
                  </div>
                  {customerProfile.scheduled_calls.length > 0 ? (
                    customerProfile.scheduled_calls.map((sc, index) => (
                      <div key={index} className="w-full rounded-xl bg-[#2c2c2c] flex p-3">
                        <div className="w-2/3">
                          <p className="text-white">{new Date(sc.scheduled_time).toLocaleString("en-IN")}</p>
                          <p className="text-[#9d9d9d] text-sm mt-1">{sc.reason ?? "No reason"}</p>
                        </div>
                        <div className="w-1/3 flex items-center justify-center">
                          <span className={`px-2 py-1 rounded-xl text-sm ${
                            sc.status === "completed" ? "bg-green-500/30 text-green-400" :
                            sc.status === "failed" ? "bg-red-500/30 text-red-400" :
                            sc.status === "initiated" ? "bg-blue-500/30 text-blue-400" :
                            "bg-amber-500/30 text-amber-400"
                          }`}>
                            {sc.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#6b6b6b] text-center">No scheduled calls</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="w-full h-1/8 p-4">
          <div className="h-full w-full bg-[#0a0a0a] rounded-2xl flex items-center px-8 py-6">
            <div className="relative w-full flex items-center">
              <div className="absolute top-1 left-0 right-0 h-px bg-amber-500/50" />
              <div className="relative w-full flex items-center justify-between">
                {callTimeline.map((session, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="h-3 w-3 bg-amber-500 rounded-full ring-2 ring-[#1a1a1a] shrink-0" />
                    <span className="text-[#dbdbdb] text-xs font-medium whitespace-nowrap">
                      {session.completed_at?.toDateString() ?? session.created_at?.toDateString()}
                    </span>
                  </div>
                ))}
                {callTimeline.length === 0 && (
                  <p className="text-[#6b6b6b] text-sm w-full text-center">No call history yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

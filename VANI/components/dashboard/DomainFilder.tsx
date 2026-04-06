import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { DashboardDomain } from "@/lib/services/basic.service";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SelectDemo({ value }: { value: DashboardDomain }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isFinance = value === "finance";

    const handleValueChange = (nextValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextValue === "all") {
            params.delete("domain");
        } else {
            params.set("domain", nextValue);
        }
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname);
    };

    return (
        <Select value={value} onValueChange={handleValueChange}>
            <SelectTrigger className={`w-full max-w-60 font-semibold scale-110 ${
                isFinance ? "border-amber-500/30 focus:ring-amber-500/30" : "border-emerald-500/30 focus:ring-emerald-500/30"
            }`}>
                <SelectValue placeholder="Select Domain" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>DOMAIN</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}

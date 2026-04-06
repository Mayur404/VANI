"use client"

import * as React from "react"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import type { DashboardDomain } from "@/lib/services/basic.service"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DateRange } from "react-day-picker"

type DatePickerWithRangeProps = {
    startDate?: string;
    endDate?: string;
    domain: DashboardDomain;
}

const parseDate = (value?: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const buildInitialRange = (startDate?: string, endDate?: string): DateRange | null => {
    const from = parseDate(startDate);
    const to = parseDate(endDate);

    if (from && to) {
        return { from, to };
    }

    return null;
}

export function DatePickerWithRange({ startDate, endDate, domain }: DatePickerWithRangeProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [date, setDate] = React.useState<DateRange | null>(buildInitialRange(startDate, endDate));
    const isFinance = domain === "finance";

    React.useEffect(() => {
        setDate(buildInitialRange(startDate, endDate))
    }, [startDate, endDate])

    const handleDateChange = (value: DateRange | undefined) => {
        const nextValue = value ?? null;
        setDate(nextValue);

        if (!nextValue?.from || !nextValue?.to) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set("startDate", format(nextValue.from, "yyyy-MM-dd"));
        params.set("endDate", format(nextValue.to, "yyyy-MM-dd"));
        params.delete("days");
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname);
    }

    return (
        <Field className="mx-auto w-60 scale-110 font-semibold">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date-picker-range"
                        className={`justify-start px-2.5 font-normal ${
                            isFinance ? "border-amber-500/30 focus:ring-amber-500/30" : "border-emerald-500/30 focus:ring-emerald-500/30"
                        }`}
                    >
                        <CalendarIcon />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date ?? undefined}
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </Field>
    )
}

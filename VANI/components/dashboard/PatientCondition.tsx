"use client"

import { Pie, PieChart } from "recharts"
import { Sector } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "A pie chart with a legend"

const base = "20, 184, 166" // teal rgb
const chartConfig = {
    patients: {
        label: "Patients",
    },
    Stable: { label: "Stable", color: "#3b82f6" },
    Recovering: { label: "Recovering", color: "#22c55e" },
    Critical: { label: "Critical", color: "#f59e0b" },
    Discharged: { label: "Discharged", color: "#ef4444" },
}

type PatientConditionChartProps = {
    data: {
        mild: number;
        moderate: number;
        severe: number;
    };
}

export function PatientConditionChart({ data }: PatientConditionChartProps) {
    const chartData = [
        { language: "Stable", patients: data.mild, fill: `rgba(${base}, 1)` },
        { language: "Recovering", patients: data.moderate, fill: `rgba(${base}, 0.85)` },
        { language: "Critical", patients: data.severe, fill: `rgba(${base}, 0.7)` },
        { language: "Discharged", patients: data.mild + data.moderate, fill: `rgba(${base}, 0.55)` },
    ]

    const totalPatients = chartData.reduce((sum, item) => sum + item.patients, 0)

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-col gap-2 px-6 ">
                <CardTitle>Patient Condition Distribution</CardTitle>
                <CardDescription>
                    Breakdown of patients by condition
                </CardDescription>

                <div className="text-2xl font-bold">
                    {totalPatients} total reports
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-75 "
                >
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="patients"
                            nameKey="language"
                            innerRadius={60}
                            stroke="none"

                            label={({ percent }) =>
                                `${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            labelLine={false}

                            activeShape={(props: any) => {
                                const { fill } = props

                                return (
                                    <Sector
                                        {...props}
                                        fill={fill}
                                        style={{
                                            filter: `drop-shadow(0 0 6px ${fill})`,
                                        }}
                                    />
                                )
                            }}
                        />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="language" />}
                            className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center "
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

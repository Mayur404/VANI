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
    English: { label: "English", color: "#3b82f6" },
    Hindi: { label: "Hindi", color: "#22c55e" },
    Telugu: { label: "Telugu", color: "#f59e0b" },
    Tamil: { label: "Tamil", color: "#ef4444" },
    Kannada: { label: "Kannada", color: "#8b5cf6" },
}

type ChartPieLegendProps = {
    data: Array<{
        language: string;
        sessions: number;
    }>;
}

export function ChartPieLegend({ data }: ChartPieLegendProps) {
    const chartData = data.slice(0, 5).map((entry, index) => ({
        language: entry.language,
        patients: entry.sessions,
        fill: `rgba(${base}, ${1 - index * 0.15})`,
    }))

    const totalPatients = chartData.reduce((sum, item) => sum + item.patients, 0)

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-col gap-2 px-6 ">
                <CardTitle>Paitent Language Distribution</CardTitle>
                <CardDescription>
                    Breakdown of patients by preferred language
                </CardDescription>

                <div className="text-2xl font-bold">
                    {totalPatients} total sessions
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

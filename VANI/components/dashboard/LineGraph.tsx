"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import type { DashboardDomain } from "@/lib/services/basic.service"

type ChartBarInteractiveProps = {
    data: Array<{
        date: string;
        totalSessions: number;
    }>;
    domain?: DashboardDomain;
}

export function ChartBarInteractive({ data, domain = "all" }: ChartBarInteractiveProps) {
    const accentColor = domain === "finance" ? "#f59e0b" : "#14b8a6"
    const chartConfig = {
        sessions: {
            label: "Doctor Sessions",
            color: accentColor,
        },
    } satisfies ChartConfig
    const chartData = data.map((entry) => ({
        day: new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        sessions: entry.totalSessions,
    }))

    const totalSessions = chartData.reduce((acc, curr) => acc + curr.sessions, 0)

    if (!chartData.length) return null

    return (
        <Card className="py-0">
            <CardHeader className="flex flex-col gap-2 px-6 pt-4 pb-3">
                <CardTitle>Doctor Sessions (Weekly)</CardTitle>
                <CardDescription>
                    Total sessions handled from Monday to Saturday
                </CardDescription>

                <div className="text-2xl font-bold">
                    {totalSessions} sessions
                </div>
            </CardHeader>

            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="h-62.5 w-full"
                >
                    <LineChart
                        data={chartData}
                        margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
                    >
                        <CartesianGrid stroke="hsl(var(--border))" vertical={false} />

                        <XAxis
                            dataKey="day"
                            tickLine={true}
                            axisLine={true}
                            interval="preserveStartEnd"
                            tickFormatter={(value, index) =>
                                index % Math.ceil(chartData.length / 6) === 0 ? value : ""
                            }
                        />

                        <ChartTooltip content={<ChartTooltipContent nameKey="sessions" />} />

                        <Line
                            type='monotoneX'
                            dataKey="sessions"
                            stroke={chartConfig.sessions.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                            style={{
                                filter: `drop-shadow(0 0 6px ${chartConfig.sessions.color})`,
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

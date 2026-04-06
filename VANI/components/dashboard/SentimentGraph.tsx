"use client"

import {
    Line,
    LineChart,
    CartesianGrid,
    XAxis,
    ResponsiveContainer,
} from "recharts"

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

type SentimentTrendChartProps = {
    data: Array<{
        date: string;
        positive: number;
        neutral: number;
        negative: number;
        frustrated: number;
    }>;
    domain?: DashboardDomain;
}

export function SentimentTrendChart({ data, domain = "all" }: SentimentTrendChartProps) {
    const accentColor = domain === "finance" ? "#f59e0b" : "#14b8a6"
    const chartConfig = {
        sentiment: {
            label: "Sentiment Score",
            color: accentColor,
        },
    } satisfies ChartConfig
    const chartData = data.map((entry) => {
        const total = entry.positive + entry.neutral + entry.negative + entry.frustrated
        const sentiment = total === 0 ? 0 : Number(((entry.positive / total) * 100).toFixed(1))
        return {
            day: new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            sentiment,
        }
    })

    const avgSentiment = chartData.length
        ? chartData.reduce((acc, curr) => acc + curr.sentiment, 0) / chartData.length
        : 0

    if (!chartData.length) return null
    const lineProps = {
        type: "monotone" as const,
        strokeWidth: 2,
        dot: false,
        activeDot: { r: 5 },
        style: {
            filter: `drop-shadow(0 0 6px ${chartConfig.sentiment.color})`,
        },
    }

    return (
        <Card className="py-0">
            <CardHeader className="flex flex-col gap-2 px-6 pt-4 pb-3">
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>
                    Patient sentiment over time
                </CardDescription>

                <div className="text-2xl font-bold">
                    {avgSentiment.toFixed(0)}% positive
                </div>
            </CardHeader>

            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="h-[250px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ left: 12, right: 12 }}
                        >
                            <CartesianGrid
                                stroke="hsl(var(--border))"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="day"
                                tickFormatter={(value, index) =>
                                    index % Math.ceil(chartData.length / 6) === 0
                                        ? value
                                        : ""
                                }
                            />

                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        nameKey="sentiment"
                                        formatter={(value) =>
                                            `${Number(value).toFixed(0)}%`
                                        }
                                    />
                                }
                            />

                            <Line
                                dataKey="sentiment"
                                stroke={chartConfig.sentiment.color}
                                {...lineProps}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

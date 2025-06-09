"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useBalanceHistory } from "@/hooks/use-trading"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"

export const description = "An interactive balance chart"

const chartConfig = {
  balance: {
    label: "Balance",
  },
  spot: {
    label: "Spot",
    color: "var(--primary)",
  },
  futures: {
    label: "Futures", 
    color: "hsl(var(--primary) / 0.6)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const params = useParams()
  const brokerId = params.brokerId as string

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const days = React.useMemo(() => {
    if (timeRange === "7d") return 7
    if (timeRange === "30d") return 30
    return 30 // Default to 30 days
  }, [timeRange])

  const { data: balanceHistory, isLoading } = useBalanceHistory(brokerId, days)

  const chartData = React.useMemo(() => {
    if (!balanceHistory) return []
    
    return balanceHistory.map((item) => {
      const spotBalance = item.balance?.find(b => b.account === "spot")?.balance || 0
      const futuresBalance = item.balance?.find(b => b.account === "futures")?.balance || 0
      
      return {
        date: item.date,
        spot: spotBalance,
        futures: futuresBalance,
      }
    })
  }, [balanceHistory])

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Account Balance</CardTitle>
          <CardDescription>Loading balance history...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Account Balance</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Balance history for the last {timeRange === "7d" ? "7 days" : "30 days"}
          </span>
          <span className="@[540px]/card:hidden">
            Last {timeRange === "7d" ? "7 days" : "30 days"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillSpot" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-spot)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-spot)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillFutures" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-futures)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-futures)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : Math.floor(chartData.length / 2)}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    name
                  ]}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="futures"
              type="natural"
              fill="url(#fillFutures)"
              stroke="var(--color-futures)"
              stackId="a"
            />
            <Area
              dataKey="spot"
              type="natural"
              fill="url(#fillSpot)"
              stroke="var(--color-spot)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

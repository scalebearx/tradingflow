"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  useSpotOpenOrders,
  useFuturesOpenOrders,
  useHoldings,
  usePositions,
  useOrders,
} from "@/hooks/use-trading"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"

export function TradingTabs() {
  const params = useParams()
  const brokerId = params.brokerId as string

  const { data: spotOpenOrders, isLoading: spotLoading } = useSpotOpenOrders(brokerId)
  const { data: futuresOpenOrders, isLoading: futuresLoading } = useFuturesOpenOrders(brokerId)
  const { data: holdings, isLoading: holdingsLoading } = useHoldings(brokerId)
  const { data: positions, isLoading: positionsLoading } = usePositions(brokerId)
  const { data: orders, isLoading: ordersLoading } = useOrders(brokerId)

  // Combine spot and futures open orders
  const allOpenOrders = React.useMemo(() => {
    const spot = spotOpenOrders?.map(order => ({ ...order, market: 'spot' as const })) || []
    const futures = futuresOpenOrders?.map(order => ({ ...order, market: 'futures' as const })) || []
    return [...spot, ...futures]
  }, [spotOpenOrders, futuresOpenOrders])

  const isOpenOrdersLoading = spotLoading || futuresLoading

  return (
    <Tabs
      defaultValue="open-orders"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="open-orders">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open-orders">Open Orders</SelectItem>
            <SelectItem value="orders">Orders</SelectItem>
            <SelectItem value="holdings-spot">Holdings (Spot)</SelectItem>
            <SelectItem value="positions-futures">Positions (Futures)</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="open-orders">
            Open Orders
            <Badge variant="secondary" className="ml-2">
              {allOpenOrders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders
            <Badge variant="secondary" className="ml-2">
              {orders?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="holdings-spot">
            Holdings (Spot)
            <Badge variant="secondary" className="ml-2">
              {holdings?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="positions-futures">
            Positions (Futures)
            <Badge variant="secondary" className="ml-2">
              {positions?.length || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="open-orders"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          {isOpenOrdersLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOpenOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No open orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  allOpenOrders.map((order) => (
                    <TableRow key={`${order.market}-${order.orderId}`}>
                      <TableCell className="font-medium">{order.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={order.market === 'spot' ? 'default' : 'secondary'}>
                          {order.market}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                          {order.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.type}</TableCell>
                      <TableCell>{order.quantity.toLocaleString()}</TableCell>
                      <TableCell>
                        {order.price ? `$${order.price.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>

      <TabsContent value="orders" className="flex flex-col px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          {ordersLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                          {order.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.type}</TableCell>
                      <TableCell>{order.quantity.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>

      <TabsContent value="holdings-spot" className="flex flex-col px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          {holdingsLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No holdings found
                    </TableCell>
                  </TableRow>
                ) : (
                  holdings?.map((holding) => (
                    <TableRow key={holding.symbol}>
                      <TableCell className="font-medium">{holding.symbol}</TableCell>
                      <TableCell>{holding.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>

      <TabsContent value="positions-futures" className="flex flex-col px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          {positionsLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Mark Price</TableHead>
                  <TableHead>PnL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No positions found
                    </TableCell>
                  </TableRow>
                ) : (
                  positions?.map((position) => (
                    <TableRow key={`${position.symbol}-${position.positionSide}`}>
                      <TableCell className="font-medium">{position.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={position.quantity > 0 ? 'default' : 'destructive'}>
                          {position.quantity > 0 ? 'LONG' : 'SHORT'}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.abs(position.quantity).toLocaleString()}</TableCell>
                      <TableCell>${position.entryPrice.toLocaleString()}</TableCell>
                      <TableCell>${position.markPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${position.unrealizedPnl.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
} 
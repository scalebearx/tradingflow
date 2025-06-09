"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, GripVertical, Plus } from "lucide-react"
import { useSubmitOrderList } from "@/hooks/use-trading"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

declare global {
  interface Window {
    TradingView: any;
  }
}

// Exact schema types matching the API
interface OrderParams {
  type: "market" | "limit" | "stop_loss_limit" | "stop_loss_market";
  quantity: number;
  side: "buy" | "sell";
  price?: number;
  stopPrice?: number;
}

interface OrderSchema {
  orderId: string;
  parentOrderId?: string;
  orderParams: OrderParams;
}

interface OrderListItem {
  market: "spot" | "futures";
  symbol: string;
  batchOrders: OrderSchema[];
  subOrderList: {
    batchOrders: OrderSchema[];
  }[];
}

type OrderList = OrderListItem[];

function generateOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function SortableOrderCard({ order, onUpdate, onDelete, index }: {
  order: OrderSchema;
  onUpdate: (order: OrderSchema) => void;
  onDelete: () => void;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.orderId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const updateOrderParams = (field: keyof OrderParams, value: any) => {
    onUpdate({
      ...order,
      orderParams: {
        ...order.orderParams,
        [field]: value
      }
    })
  }

  return (
    <Card ref={setNodeRef} style={style} className="relative bg-gradient-to-r from-slate-50 to-white border border-slate-200 hover:border-blue-300 transition-all duration-200">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-blue-50 rounded"
            >
              <GripVertical className="h-4 w-4 text-slate-400" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-700">Order #{index + 1}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`side-${order.orderId}`} className="text-xs font-medium text-slate-600">Side</Label>
            <Select value={order.orderParams.side} onValueChange={(value: "buy" | "sell") => updateOrderParams("side", value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">Buy</Badge>
                </SelectItem>
                <SelectItem value="sell">
                  <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">Sell</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`type-${order.orderId}`} className="text-xs font-medium text-slate-600">Type</Label>
            <Select value={order.orderParams.type} onValueChange={(value: OrderParams["type"]) => updateOrderParams("type", value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
                <SelectItem value="stop_loss_limit">Stop Loss Limit</SelectItem>
                <SelectItem value="stop_loss_market">Stop Loss Market</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor={`quantity-${order.orderId}`} className="text-xs font-medium text-slate-600">Quantity</Label>
          <Input
            id={`quantity-${order.orderId}`}
            type="number"
            step="0.00001"
            min="0"
            value={order.orderParams.quantity || ""}
            onChange={(e) => updateOrderParams("quantity", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="h-8 text-sm"
          />
        </div>

        {(order.orderParams.type === "limit" || order.orderParams.type === "stop_loss_limit") && (
          <div className="space-y-1">
            <Label htmlFor={`price-${order.orderId}`} className="text-xs font-medium text-slate-600">Price</Label>
            <Input
              id={`price-${order.orderId}`}
              type="number"
              step="0.01"
              min="0"
              value={order.orderParams.price || ""}
              onChange={(e) => updateOrderParams("price", parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
              className="h-8 text-sm"
            />
          </div>
        )}

        {(order.orderParams.type === "stop_loss_limit" || order.orderParams.type === "stop_loss_market") && (
          <div className="space-y-1">
            <Label htmlFor={`stopPrice-${order.orderId}`} className="text-xs font-medium text-slate-600">Stop Price</Label>
            <Input
              id={`stopPrice-${order.orderId}`}
              type="number"
              step="0.01"
              min="0"
              value={order.orderParams.stopPrice || ""}
              onChange={(e) => updateOrderParams("stopPrice", parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
              className="h-8 text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CreateOrderDialog() {
  const params = useParams()
  const brokerId = params.brokerId as string
  const [open, setOpen] = useState(false)
  const [orderList, setOrderList] = useState<OrderList>([])
  const submitOrderList = useSubmitOrderList()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const addOrderListItem = () => {
    const newItem: OrderListItem = {
      market: "spot",
      symbol: "BTCUSDT",
      batchOrders: [{
        orderId: generateOrderId(),
        orderParams: {
          type: "market",
          quantity: 0.001, // Set a default positive value
          side: "buy"
        }
      }],
      subOrderList: [] // Required empty array
    }
    setOrderList([...orderList, newItem])
  }

  const updateOrderListItem = (index: number, field: keyof OrderListItem, value: any) => {
    const updated = [...orderList]
    updated[index] = { ...updated[index], [field]: value }
    setOrderList(updated)
  }

  const addBatchOrder = (itemIndex: number) => {
    const updated = [...orderList]
    updated[itemIndex].batchOrders.push({
      orderId: generateOrderId(),
      orderParams: {
        type: "market",
        quantity: 0.001, // Set a default positive value
        side: "buy"
      }
    })
    setOrderList(updated)
  }

  const addSubOrderList = (itemIndex: number) => {
    const updated = [...orderList]
    updated[itemIndex].subOrderList.push({
      batchOrders: [{
        orderId: generateOrderId(),
        orderParams: {
          type: "market",
          quantity: 0.001,
          side: "buy"
        }
      }]
    })
    setOrderList(updated)
  }

  const addSubBatchOrder = (itemIndex: number, subIndex: number) => {
    const updated = [...orderList]
    updated[itemIndex].subOrderList[subIndex].batchOrders.push({
      orderId: generateOrderId(),
      orderParams: {
        type: "market",
        quantity: 0.001,
        side: "buy"
      }
    })
    setOrderList(updated)
  }

  const updateBatchOrder = (itemIndex: number, orderIndex: number, order: OrderSchema) => {
    const updated = [...orderList]
    updated[itemIndex].batchOrders[orderIndex] = order
    setOrderList(updated)
  }

  const updateSubBatchOrder = (itemIndex: number, subIndex: number, orderIndex: number, order: OrderSchema) => {
    const updated = [...orderList]
    updated[itemIndex].subOrderList[subIndex].batchOrders[orderIndex] = order
    setOrderList(updated)
  }

  const deleteBatchOrder = (itemIndex: number, orderIndex: number) => {
    const updated = [...orderList]
    updated[itemIndex].batchOrders.splice(orderIndex, 1)
    if (updated[itemIndex].batchOrders.length === 0) {
      updated.splice(itemIndex, 1)
    }
    setOrderList(updated)
  }

  const deleteSubBatchOrder = (itemIndex: number, subIndex: number, orderIndex: number) => {
    const updated = [...orderList]
    updated[itemIndex].subOrderList[subIndex].batchOrders.splice(orderIndex, 1)
    if (updated[itemIndex].subOrderList[subIndex].batchOrders.length === 0) {
      updated[itemIndex].subOrderList.splice(subIndex, 1)
    }
    setOrderList(updated)
  }

  const handleDragEnd = (event: DragEndEvent, itemIndex: number) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const updated = [...orderList]
      const orders = updated[itemIndex].batchOrders
      const oldIndex = orders.findIndex(order => order.orderId === active.id)
      const newIndex = orders.findIndex(order => order.orderId === over.id)
      
      updated[itemIndex].batchOrders = arrayMove(orders, oldIndex, newIndex)
      setOrderList(updated)
    }
  }

  const handleSubDragEnd = (event: DragEndEvent, itemIndex: number, subIndex: number) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const updated = [...orderList]
      const orders = updated[itemIndex].subOrderList[subIndex].batchOrders
      const oldIndex = orders.findIndex(order => order.orderId === active.id)
      const newIndex = orders.findIndex(order => order.orderId === over.id)
      
      updated[itemIndex].subOrderList[subIndex].batchOrders = arrayMove(orders, oldIndex, newIndex)
      setOrderList(updated)
    }
  }

  const validateOrderList = (orderList: OrderList): string | null => {
    if (orderList.length === 0) {
      return "Please add at least one order group"
    }

    for (const item of orderList) {
      if (!item.symbol.trim()) {
        return "Please enter a symbol for all order groups"
      }
      
      if (item.batchOrders.length === 0) {
        return "Each order group must have at least one order"
      }

      for (const order of item.batchOrders) {
        if (!order.orderParams.quantity || order.orderParams.quantity <= 0) {
          return "Please enter valid quantities (> 0) for all orders"
        }
        
        // Validate price for limit orders
        if ((order.orderParams.type === "limit" || order.orderParams.type === "stop_loss_limit")) {
          if (!order.orderParams.price || order.orderParams.price <= 0) {
            return "Please enter valid prices (> 0) for limit orders"
          }
        }
        
        // Validate stop price for stop loss orders
        if ((order.orderParams.type === "stop_loss_limit" || order.orderParams.type === "stop_loss_market")) {
          if (!order.orderParams.stopPrice || order.orderParams.stopPrice <= 0) {
            return "Please enter valid stop prices (> 0) for stop loss orders"
          }
        }
      }
    }

    return null
  }

  const handleSubmit = async () => {
    const validationError = validateOrderList(orderList)
    if (validationError) {
      toast.error(validationError)
      return
    }

    // Clean up the data to match schema exactly
    const cleanOrderList: OrderList = orderList.map(item => ({
      market: item.market,
      symbol: item.symbol.trim().toUpperCase(),
      batchOrders: item.batchOrders.map(order => ({
        orderId: order.orderId,
        ...(order.parentOrderId ? { parentOrderId: order.parentOrderId } : {}),
        orderParams: {
          type: order.orderParams.type,
          quantity: Number(order.orderParams.quantity),
          side: order.orderParams.side,
          ...(order.orderParams.price ? { price: Number(order.orderParams.price) } : {}),
          ...(order.orderParams.stopPrice ? { stopPrice: Number(order.orderParams.stopPrice) } : {}),
        }
      })),
      subOrderList: item.subOrderList || []
    }))

    console.log("Submitting order list:", JSON.stringify(cleanOrderList, null, 2))

    try {
      await submitOrderList.mutateAsync({ brokerId, orderList: cleanOrderList })
      toast.success("Order list submitted successfully!")
      setOpen(false)
      setOrderList([])
    } catch (error) {
      console.error("Order submission error:", error)
      toast.error(`Failed to submit order list: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-auto px-6 bg-blue-700 hover:bg-blue-800" size="sm">Create Order List</Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Create Order List</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {orderList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <div className="max-w-sm mx-auto">
                <p className="text-slate-500 mb-4 text-sm">No orders yet. Add your first order group to get started.</p>
                <Button onClick={addOrderListItem} className="bg-blue-700 hover:bg-blue-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Order Group
                </Button>
              </div>
            </div>
          ) : (
            orderList.map((item, itemIndex) => (
              <Card key={itemIndex} className="border-2 border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800">Order Group #{itemIndex + 1}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addBatchOrder(itemIndex)}
                        className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Order
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSubOrderList(itemIndex)}
                        className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Sub-Order List
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Market</Label>
                      <Select 
                        value={item.market} 
                        onValueChange={(value: "spot" | "futures") => updateOrderListItem(itemIndex, "market", value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spot">Spot</SelectItem>
                          <SelectItem value="futures">Futures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">Symbol</Label>
                      <Input
                        value={item.symbol}
                        onChange={(e) => updateOrderListItem(itemIndex, "symbol", e.target.value.toUpperCase())}
                        placeholder="BTCUSDT"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {/* Main Batch Orders */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Main Orders</h4>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, itemIndex)}
                    >
                      <SortableContext
                        items={item.batchOrders.map(order => order.orderId)}
                        strategy={verticalListSortingStrategy}
                      >
                        {item.batchOrders.map((order, orderIndex) => (
                          <SortableOrderCard
                            key={order.orderId}
                            order={order}
                            index={orderIndex}
                            onUpdate={(updatedOrder) => updateBatchOrder(itemIndex, orderIndex, updatedOrder)}
                            onDelete={() => deleteBatchOrder(itemIndex, orderIndex)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>

                  {/* Sub Order Lists */}
                  {item.subOrderList.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">Sub-Order Lists</h4>
                      {item.subOrderList.map((subList, subIndex) => (
                        <Card key={subIndex} className="border border-green-200 bg-green-50/30">
                          <CardHeader className="pb-2 pt-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-green-800">Sub-Order List #{subIndex + 1}</CardTitle>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addSubBatchOrder(itemIndex, subIndex)}
                                className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Sub-Order
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleSubDragEnd(event, itemIndex, subIndex)}
                            >
                              <SortableContext
                                items={subList.batchOrders.map(order => order.orderId)}
                                strategy={verticalListSortingStrategy}
                              >
                                {subList.batchOrders.map((order, orderIndex) => (
                                  <SortableOrderCard
                                    key={order.orderId}
                                    order={order}
                                    index={orderIndex}
                                    onUpdate={(updatedOrder) => updateSubBatchOrder(itemIndex, subIndex, orderIndex, updatedOrder)}
                                    onDelete={() => deleteSubBatchOrder(itemIndex, subIndex, orderIndex)}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {orderList.length > 0 && (
            <div className="flex gap-3 pt-2">
              <Button onClick={addOrderListItem} variant="outline" className="flex-1 h-9 border-blue-200 text-blue-700 hover:bg-blue-50">
                <Plus className="h-4 w-4 mr-2" />
                Add Order Group
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitOrderList.isPending}
                className="flex-1 h-9 bg-blue-700 hover:bg-blue-800"
              >
                {submitOrderList.isPending ? "Submitting..." : "Submit Order List"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TradingInterface() {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    // 清理之前的 widget
    if (widgetRef.current) {
      widgetRef.current = null
    }

    if (containerRef.current) {
      // 清空容器
      containerRef.current.innerHTML = ""
      
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
      script.type = "text/javascript"
      script.async = true
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: "BINANCE:BTCUSDT",
        interval: "D",
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
        calendar: false,
        support_host: "https://www.tradingview.com"
      })

      containerRef.current.appendChild(script)
    }

    return () => {
      // 清理函數
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
      if (widgetRef.current) {
        widgetRef.current = null
      }
    }
  }, []) // 空依賴數組，只在組件掛載時執行一次

  return (
    <div className="space-y-6">
      <div className="w-full h-[600px]">
        <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
          <div 
            ref={containerRef} 
            className="tradingview-widget-container__widget" 
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      </div>
      
      <div className="flex justify-center">
        <CreateOrderDialog />
      </div>
    </div>
  )
} 
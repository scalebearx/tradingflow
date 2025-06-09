import { AppSidebar } from "@/components/app-sidebar"
import { BrokerSelector } from "@/components/broker-selector"
import { TradingInterface } from "@/components/trading-interface"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface PageProps {
  params: {
    brokerId: string;
  };
}

export default function TradePage({ params }: PageProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <BrokerSelector />
              </div>
              <div className="px-4 lg:px-6">
                <TradingInterface />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 
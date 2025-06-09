"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconPlus, IconChevronDown, IconBuilding, IconRefresh } from "@tabler/icons-react";
import { useBrokers, useRefreshBrokers } from "@/hooks/use-brokers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBrokerDialog } from "./add-broker-dialog";

export function BrokerSelector() {
  const { data: brokers, isLoading } = useBrokers();
  const refreshBrokers = useRefreshBrokers();
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const router = useRouter();
  const params = useParams();

  // Set default broker (first one) and handle URL routing
  useEffect(() => {
    if (brokers && brokers.length > 0) {
      const brokerId = params.brokerId as string;
      if (brokerId && brokers.find(b => b.id === brokerId)) {
        setSelectedBroker(brokerId);
      } else {
        // Default to first broker and update URL
        const firstBroker = brokers[0];
        setSelectedBroker(firstBroker.id);
        router.replace(`/dashboard/${firstBroker.id}`);
      }
    }
  }, [brokers, params.brokerId, router]);

  const selectedBrokerData = brokers?.find(broker => broker.id === selectedBroker);

  const handleBrokerSelect = (brokerId: string) => {
    setSelectedBroker(brokerId);
    router.push(`/dashboard/${brokerId}`);
  };

  const handleAddBroker = () => {
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-48" />
      </div>
    );
  }

  return (
    <>
    <div className="flex items-center gap-2">
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-48 justify-between"
          size="sm"
        >
          <div className="flex items-center gap-2">
            <IconBuilding className="h-4 w-4" />
            <span className="truncate">
              {selectedBrokerData ? selectedBrokerData.label : "Select Broker"}
            </span>
            {selectedBrokerData && (
              <Badge variant="secondary" className="text-xs">
                {selectedBrokerData.exchange}
              </Badge>
            )}
          </div>
          <IconChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        {brokers && brokers.length > 0 ? (
          <>
                         {brokers.map((broker) => (
               <DropdownMenuItem
                 key={broker.id}
                 onClick={() => handleBrokerSelect(broker.id)}
                 className="flex items-center justify-between"
               >
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4" />
                  <span className="truncate">{broker.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {broker.exchange}
                </Badge>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <>
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No brokers found</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleAddBroker} className="text-primary">
          <IconPlus className="h-4 w-4 mr-2" />
          Add Broker
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Button
      variant="outline"
      size="sm"
      onClick={refreshBrokers}
      className="px-2"
    >
      <IconRefresh className="h-4 w-4" />
    </Button>
    </div>
    <AddBrokerDialog 
      open={showAddDialog} 
      onOpenChange={setShowAddDialog}
    />
  </>
  );
} 
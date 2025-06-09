"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBroker } from "@/hooks/use-brokers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formSchema = z.object({
  exchange: z.enum(["binance", "bybit"], {
    required_error: "Please select an exchange",
  }),
  label: z.string().min(1, "Label is required"),
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().min(1, "API Secret is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AddBrokerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBrokerDialog({ open, onOpenChange }: AddBrokerDialogProps) {
  const createBroker = useCreateBroker();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exchange: undefined,
      label: "",
      apiKey: "",
      apiSecret: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    // Close dialog immediately after submission
    onOpenChange(false);
    form.reset();
    
    try {
      await createBroker.mutateAsync(data);
      toast.success("Broker added successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add broker";
      toast.error(errorMessage);
      console.error("Error adding broker:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Broker</DialogTitle>
          <DialogDescription>
            Add a new broker account to manage your trading operations. 
            <br />
            <strong>Note:</strong> For Binance, ensure your API key has Spot Trading, Futures Trading, and Reading permissions enabled.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="exchange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an exchange" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="bybit" disabled>Bybit (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., My Trading Account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your API secret" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createBroker.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBroker.isPending}>
                {createBroker.isPending ? "Adding..." : "Add Broker"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
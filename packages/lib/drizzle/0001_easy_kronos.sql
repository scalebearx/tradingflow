CREATE TABLE "brokers" (
	"id" text PRIMARY KEY NOT NULL,
	"exchange" text NOT NULL,
	"label" text NOT NULL,
	"apiKey" text NOT NULL,
	"apiSecret" text NOT NULL,
	"status" text NOT NULL,
	"ipRestricted" boolean DEFAULT false NOT NULL,
	"credentialsCreatedAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "brokers_userId_label_unique" UNIQUE("userId","label"),
	CONSTRAINT "brokers_apiKey_apiSecret_unique" UNIQUE("apiKey","apiSecret")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"parentOrderId" text,
	"symbol" text NOT NULL,
	"market" text NOT NULL,
	"side" text NOT NULL,
	"type" text NOT NULL,
	"price" double precision,
	"quantity" double precision NOT NULL,
	"stopPrice" double precision,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"brokerId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brokers" ADD CONSTRAINT "brokers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_brokerId_brokers_id_fk" FOREIGN KEY ("brokerId") REFERENCES "public"."brokers"("id") ON DELETE cascade ON UPDATE no action;
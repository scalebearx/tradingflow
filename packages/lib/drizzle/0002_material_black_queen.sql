ALTER TABLE "brokers" RENAME COLUMN "apiKey" TO "api_key";--> statement-breakpoint
ALTER TABLE "brokers" RENAME COLUMN "apiSecret" TO "api_secret";--> statement-breakpoint
ALTER TABLE "brokers" RENAME COLUMN "ipRestricted" TO "ip_restricted";--> statement-breakpoint
ALTER TABLE "brokers" RENAME COLUMN "credentialsCreatedAt" TO "credentials_created_at";--> statement-breakpoint
ALTER TABLE "brokers" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "brokers" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "brokers" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "parentOrderId" TO "parent_order_id";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "stopPrice" TO "stop_price";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "brokerId" TO "broker_id";--> statement-breakpoint
ALTER TABLE "brokers" DROP CONSTRAINT "brokers_userId_label_unique";--> statement-breakpoint
ALTER TABLE "brokers" DROP CONSTRAINT "brokers_apiKey_apiSecret_unique";--> statement-breakpoint
ALTER TABLE "brokers" DROP CONSTRAINT "brokers_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_brokerId_brokers_id_fk";
--> statement-breakpoint
ALTER TABLE "brokers" ADD CONSTRAINT "brokers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brokers" ADD CONSTRAINT "broker_user_label_unique" UNIQUE("user_id","label");--> statement-breakpoint
ALTER TABLE "brokers" ADD CONSTRAINT "broker_api_key_api_secret_unique" UNIQUE("api_key","api_secret");
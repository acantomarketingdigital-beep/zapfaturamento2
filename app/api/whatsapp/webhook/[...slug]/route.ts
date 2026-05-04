// Evolution API with byEvents:true appends the event name to the webhook URL
// e.g. POST /api/whatsapp/webhook/messages-upsert
//      POST /api/whatsapp/webhook/connection-update
// This catch-all delegates to the same handler.
export { GET, POST } from "@/app/api/whatsapp/webhook/route";

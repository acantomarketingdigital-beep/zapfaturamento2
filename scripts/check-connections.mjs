import pkg from "pg";
const { Client } = pkg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Check connections
const c = await client.query(`SELECT id, client_slug, session_id, status, phone_number FROM whatsapp_connections LIMIT 10`);
console.log("=== whatsapp_connections ===");
console.table(c.rows);

// Check distinct whatsapp_number used in leads
const w = await client.query(`
  SELECT DISTINCT whatsapp_number, client_slug, COUNT(*) AS leads
  FROM whatsapp_leads
  WHERE client_slug = 'dra-jennifer-kachinski'
  GROUP BY whatsapp_number, client_slug
`);
console.log("=== whatsapp_number por cliente ===");
console.table(w.rows);

await client.end();

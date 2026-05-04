import pkg from "pg";
const { Client } = pkg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const r = await client.query(`
  SELECT id,
         client_slug,
         COALESCE(lead_name,'[null]')  AS lead_name,
         COALESCE(lead_phone,'[null]') AS lead_phone,
         has_replied,
         TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI DD/MM') AS entrada,
         COALESCE(creative_slug, SUBSTRING(utm_content,1,25), '[sem criativo]') AS criativo
  FROM whatsapp_leads
  ORDER BY created_at DESC
  LIMIT 12
`);
console.table(r.rows);
await client.end();

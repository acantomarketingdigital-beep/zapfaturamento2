/**
 * Reset operacional do banco de dados do Zap Faturamento.
 *
 * O que faz:
 *   - Apaga TODOS os dados operacionais (clientes, leads, campanhas, investimentos, conexoes)
 *   - Mantém usuários com role = 'agency_admin'
 *   - Remove usuários com role = 'client_user' (ligados a clientes apagados)
 *   - NÃO apaga estrutura (tabelas, colunas, índices, sequences)
 *   - NÃO apaga migrations
 *   - Reinicia sequences de IDs (auto-increment volta a 1)
 *
 * Uso:
 *   DATABASE_URL=postgres://... node scripts/reset-database.mjs
 *   ou, se .env.production.local estiver configurado:
 *   node scripts/reset-database.mjs
 */

import pg from "pg";
import { readFileSync } from "fs";
import { createInterface } from "readline";

// ── Carregar DATABASE_URL ─────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  try {
    const lines = readFileSync(".env.production.local", "utf8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Z_]+)=(.+)/);
      if (m) process.env[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
    }
  } catch {
    // ignore missing file
  }
}

if (!process.env.DATABASE_URL) {
  console.error("ERRO: DATABASE_URL nao configurada.");
  process.exit(1);
}

// ── Confirmação interativa ───────────────────────────────────────────────────

async function confirm(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  // 1. Mostrar quem será mantido e o que será apagado
  const usersRes = await client.query(
    "SELECT id, email, role FROM users ORDER BY id"
  );

  const adminUsers = usersRes.rows.filter((u) => u.role === "agency_admin");
  const clientUsers = usersRes.rows.filter((u) => u.role === "client_user");

  const countsRes = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM clients)                 AS clients,
      (SELECT COUNT(*) FROM whatsapp_leads)          AS leads,
      (SELECT COUNT(*) FROM ad_spend)                AS ad_spend,
      (SELECT COUNT(*) FROM client_campaigns)        AS campaigns,
      (SELECT COUNT(*) FROM whatsapp_connections)    AS connections,
      (SELECT COUNT(*) FROM whatsapp_conversations)  AS conversations,
      (SELECT COUNT(*) FROM whatsapp_messages)       AS messages,
      (SELECT COUNT(*) FROM whatsapp_connection_users) AS connection_users,
      (SELECT COUNT(*) FROM lead_status_history)     AS lead_history
  `);
  const counts = countsRes.rows[0];

  console.log("\n=========================================");
  console.log("  RESET OPERACIONAL - Zap Faturamento");
  console.log("=========================================\n");

  console.log("USUÁRIOS QUE SERÃO MANTIDOS (agency_admin):");
  adminUsers.forEach((u) => console.log(`  ✓ [${u.id}] ${u.email}`));

  if (clientUsers.length > 0) {
    console.log("\nUSUÁRIOS QUE SERÃO REMOVIDOS (client_user):");
    clientUsers.forEach((u) => console.log(`  ✗ [${u.id}] ${u.email}`));
  }

  console.log("\nDADOS QUE SERÃO APAGADOS:");
  Object.entries(counts).forEach(([table, count]) => {
    const n = Number(count);
    const mark = n > 0 ? "✗" : "○";
    console.log(`  ${mark} ${table}: ${n} registro(s)`);
  });

  console.log("\n⚠  Esta operação é IRREVERSÍVEL.");
  const answer = await confirm('\nDigite CONFIRMAR para prosseguir (ou qualquer outra coisa para cancelar): ');

  if (answer !== "confirmar") {
    console.log("\nOperação cancelada. Nenhum dado foi alterado.");
    await client.end();
    process.exit(0);
  }

  // 2. Executar reset em transação
  console.log("\nIniciando reset...");

  await client.query("BEGIN");

  // Apagar na ordem correta respeitando FKs.
  // Tabelas com ON DELETE CASCADE serão limpas automaticamente quando o pai
  // for truncado, mas listamos explicitamente para clareza e para reiniciar
  // as sequences corretamente.
  const resetSteps = [
    // Sem FKs formais — apagar primeiro para evitar erros de referência lógica
    { table: "lead_status_history",      label: "lead_status_history" },
    // Folhas das conexões WhatsApp
    { table: "whatsapp_messages",        label: "whatsapp_messages" },
    { table: "whatsapp_connection_users", label: "whatsapp_connection_users" },
    { table: "whatsapp_conversations",   label: "whatsapp_conversations" },
    { table: "whatsapp_connections",     label: "whatsapp_connections" },
    // Dados de campanhas e investimentos
    { table: "client_campaigns",         label: "client_campaigns" },
    { table: "ad_spend",                 label: "ad_spend" },
    // Leads
    { table: "whatsapp_leads",           label: "whatsapp_leads" },
    // Clientes (raiz)
    { table: "clients",                  label: "clients" },
  ];

  for (const step of resetSteps) {
    const before = await client.query(`SELECT COUNT(*) AS n FROM ${step.table}`);
    await client.query(`TRUNCATE TABLE ${step.table} RESTART IDENTITY CASCADE`);
    const n = Number(before.rows[0].n);
    console.log(`  ✓ ${step.label}: ${n} registro(s) removido(s)`);
  }

  // Remover client_user (ligados a clientes apagados)
  const delUsers = await client.query(
    "DELETE FROM users WHERE role = 'client_user' RETURNING id, email"
  );
  if (delUsers.rowCount > 0) {
    delUsers.rows.forEach((u) =>
      console.log(`  ✓ users (client_user): removido ${u.email}`)
    );
  } else {
    console.log("  ○ users (client_user): nenhum para remover");
  }

  await client.query("COMMIT");

  // 3. Validação pós-reset
  console.log("\n=========================================");
  console.log("  VALIDAÇÃO PÓS-RESET");
  console.log("=========================================");

  const postRes = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM clients)              AS clients,
      (SELECT COUNT(*) FROM whatsapp_leads)       AS leads,
      (SELECT COUNT(*) FROM ad_spend)             AS ad_spend,
      (SELECT COUNT(*) FROM client_campaigns)     AS campaigns,
      (SELECT COUNT(*) FROM users)                AS users_total,
      (SELECT COUNT(*) FROM users WHERE role = 'agency_admin') AS admins
  `);
  const post = postRes.rows[0];
  Object.entries(post).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log("\n✅ Reset concluído com sucesso.");
  console.log("   O sistema está limpo e pronto para novos testes.");
  console.log("   Acesse /dashboard para confirmar o estado vazio.\n");

} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("\n❌ ERRO durante o reset:", err.message);
  console.error("   Nenhuma alteração foi aplicada (transação revertida).");
  process.exit(1);
} finally {
  await client.end();
}

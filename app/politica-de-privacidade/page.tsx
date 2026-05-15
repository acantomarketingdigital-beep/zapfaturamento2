export default function PoliticaPrivacidadePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "inherit", lineHeight: 1.7, color: "#111827" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 8 }}>Política de Privacidade</h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 40 }}>Última atualização: maio de 2025</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>1. Quem somos</h2>
        <p>
          O Zap Faturamento é uma plataforma de rastreamento e gerenciamento de leads via WhatsApp, operada por seus clientes parceiros (clínicas, empresas e profissionais). Cada página de redirecionamento pertence a um cliente específico identificado pelo domínio e slug da URL.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>2. Dados coletados</h2>
        <p>Ao acessar um link de campanha, podemos coletar automaticamente:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Parâmetros de rastreamento da URL (UTMs, gclid, fbclid)</li>
          <li>Endereço IP e informações do dispositivo (tipo, sistema operacional, idioma)</li>
          <li>Referência de origem (de onde você veio antes de acessar a página)</li>
          <li>Cookies de rastreamento de plataformas de anúncios (Meta Pixel, Google Ads, GTM)</li>
          <li>Data e hora do acesso</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Não coletamos nome, e-mail, telefone ou qualquer dado pessoal identificável diretamente nesta página. Essas informações são fornecidas voluntariamente pelo usuário ao iniciar uma conversa no WhatsApp.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>3. Finalidade do tratamento</h2>
        <p>Os dados são utilizados para:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Rastrear a origem dos leads e a efetividade das campanhas de marketing</li>
          <li>Registrar conversões no Meta Ads e Google Ads para otimização de campanhas</li>
          <li>Gerenciar o relacionamento com leads no CRM do cliente parceiro</li>
          <li>Gerar relatórios de desempenho para os clientes da plataforma</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>4. Compartilhamento de dados</h2>
        <p>
          Os dados de rastreamento podem ser compartilhados com as plataformas de anúncios utilizadas pelo cliente parceiro (Meta Ads / Facebook, Google Ads, Google Analytics), conforme configurado em cada campanha. Não vendemos, alugamos nem compartilhamos dados com terceiros para fins comerciais próprios.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>5. Cookies</h2>
        <p>
          Utilizamos cookies de sessão e cookies de rastreamento de plataformas de terceiros (Meta Pixel, Google Tag Manager). Ao continuar navegando, você concorda com o uso desses cookies. Você pode desativá-los nas configurações do seu navegador, mas isso pode afetar o funcionamento das páginas.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>6. Retenção de dados</h2>
        <p>
          Os dados de rastreamento são armazenados pelo tempo necessário para cumprir as finalidades descritas acima, respeitando os prazos legais aplicáveis à legislação brasileira (LGPD — Lei nº 13.709/2018) e, quando aplicável, ao GDPR.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>7. Seus direitos</h2>
        <p>De acordo com a LGPD, você tem o direito de:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Confirmar a existência de tratamento de dados</li>
          <li>Acessar seus dados</li>
          <li>Solicitar correção de dados incompletos ou inexatos</li>
          <li>Solicitar a exclusão de dados desnecessários</li>
          <li>Revogar o consentimento a qualquer momento</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Para exercer esses direitos, entre em contato com o cliente parceiro responsável pela campanha que você acessou.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>8. Alterações nesta política</h2>
        <p>
          Esta política pode ser atualizada periodicamente. A data de atualização no topo desta página indica a versão mais recente. Recomendamos que você a consulte regularmente.
        </p>
      </section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e5e7eb" }}>
        <a href="/" style={{ color: "#6b7280", fontSize: "0.875rem", textDecoration: "none" }}>← Voltar ao início</a>
      </div>
    </main>
  );
}

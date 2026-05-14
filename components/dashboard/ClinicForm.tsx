import {
  getKommoCustomFieldDefinitions,
  type ManagedClinicFormValues,
  type ManagedClinicRecord
} from "@/lib/clinics";

type ClinicFormProps = {
  values: ManagedClinicFormValues;
  selectedClinic?: ManagedClinicRecord | null;
  databaseReady: boolean;
};

export function ClinicForm({
  values,
  selectedClinic,
  databaseReady
}: ClinicFormProps) {
  const customFieldDefinitions = getKommoCustomFieldDefinitions();

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h2>{selectedClinic ? "Editar clinica" : "Nova clinica"}</h2>
          <p className="dashboard-helper">
            Dados salvos aqui passam a ter prioridade sobre o arquivo
            <code> lib/clients.ts </code>.
          </p>
        </div>
        {selectedClinic ? (
          <span className="dashboard-pill dashboard-pill--pending">
            Fonte: {selectedClinic.source === "database" ? "Banco" : "Arquivo"}
          </span>
        ) : null}
      </div>

      {!databaseReady ? (
        <div className="dashboard-alert dashboard-alert--warning">
          Configure <code>DATABASE_URL</code> e rode as migrations para salvar
          clinicas pelo painel.
        </div>
      ) : null}

      <form
        action="/dashboard/clinicas/save"
        method="post"
        className="dashboard-form-grid"
      >
        <input type="hidden" name="existingSlug" value={values.existingSlug || ""} />

        <label className="dashboard-field">
          <span>Nome da clinica</span>
          <input
            type="text"
            name="clientName"
            defaultValue={values.clientName}
            placeholder="Clinica Exemplo"
            disabled={!databaseReady}
            required
          />
        </label>

        <label className="dashboard-field">
          <span>Slug da URL</span>
          <input
            type="text"
            name="clientSlug"
            defaultValue={values.clientSlug}
            placeholder="clinica-exemplo"
            disabled={!databaseReady}
            required
          />
        </label>

        <label className="dashboard-field">
          <span>Numero do WhatsApp</span>
          <input
            type="text"
            name="whatsappNumber"
            defaultValue={values.whatsappNumber}
            placeholder="5599999999999"
            disabled={!databaseReady}
            required
          />
        </label>

        <label className="dashboard-field">
          <span>Meta Pixel ID</span>
          <input
            type="text"
            name="metaPixelId"
            defaultValue={values.metaPixelId}
            disabled={!databaseReady}
          />
        </label>

        <label className="dashboard-field">
          <span>GTM ID</span>
          <input
            type="text"
            name="gtmId"
            defaultValue={values.gtmId}
            placeholder="GTM-XXXXXXX"
            disabled={!databaseReady}
          />
          <small className="dashboard-helper">
            O evento <code>whatsapp_redirect</code> e enviado ao dataLayer com gclid, UTMs e dados do lead. Configure uma tag de conversao do Google Ads no GTM usando este evento como gatilho.
          </small>
        </label>

        <label className="dashboard-field">
          <span>GA4 ID</span>
          <input
            type="text"
            name="ga4Id"
            defaultValue={values.ga4Id}
            placeholder="G-XXXXXXXXXX"
            disabled={!databaseReady}
          />
        </label>

        <div className="dashboard-field dashboard-field--full">
          <div className="dashboard-card dashboard-card--nested" style={{ padding: "12px 14px", gap: 10, display: "grid" }}>
            <div>
              <strong style={{ fontSize: "0.82rem" }}>Conversao direta no Google Ads (sem GA4)</strong>
              <p className="dashboard-helper" style={{ marginTop: 4 }}>
                Preencha os dois campos abaixo para disparar conversoes diretamente na conta do Google Ads, sem precisar importar do GA4. Acesse Google Ads &rarr; Metas &rarr; Conversoes &rarr; escolha a acao &rarr; use o &ldquo;ID de conversao&rdquo; (AW-XXXXXXXXX) e o &ldquo;Label de conversao&rdquo;.
              </p>
            </div>
            <label className="dashboard-field">
              <span>Google Ads ID</span>
              <input
                type="text"
                name="googleAdsId"
                defaultValue={values.googleAdsId}
                placeholder="AW-XXXXXXXXX"
                disabled={!databaseReady}
              />
            </label>
            <label className="dashboard-field">
              <span>Google Ads Conversion Label</span>
              <input
                type="text"
                name="googleAdsConversionLabel"
                defaultValue={values.googleAdsConversionLabel}
                placeholder="AbCdEfGhIjK"
                disabled={!databaseReady}
              />
            </label>
          </div>
        </div>

        <label className="dashboard-field">
          <span>Kommo Pipeline ID</span>
          <input
            type="number"
            name="kommoPipelineId"
            defaultValue={values.kommoPipelineId ?? ""}
            disabled={!databaseReady}
          />
        </label>

        <label className="dashboard-field">
          <span>Kommo Status ID</span>
          <input
            type="number"
            name="kommoStatusId"
            defaultValue={values.kommoStatusId ?? ""}
            disabled={!databaseReady}
          />
        </label>

        <label className="dashboard-toggle">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive}
            disabled={!databaseReady}
          />
          <span>Clinica ativa para receber redirecionamentos</span>
        </label>

        <div className="dashboard-card dashboard-card--nested dashboard-field--full">
          <div className="dashboard-card__header">
            <div>
              <h3>Campos personalizados da Kommo</h3>
              <p className="dashboard-helper">
                Deixe vazio quando o campo ainda nao existir. O lead continua
                sendo criado com a nota completa.
              </p>
            </div>
          </div>

          <div className="dashboard-custom-grid">
            {customFieldDefinitions.map((field) => (
              <label key={field.key} className="dashboard-field">
                <span>{field.label}</span>
                <input
                  type="number"
                  name={`kommoCustomFields.${field.key}`}
                  defaultValue={values.kommoCustomFields[field.key] ?? ""}
                  disabled={!databaseReady}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="dashboard-actions dashboard-field--full">
          <button type="submit" className="dashboard-button" disabled={!databaseReady}>
            {selectedClinic ? "Salvar alteracoes" : "Criar clinica"}
          </button>
          <a
            href="/dashboard/clinicas"
            className="dashboard-button dashboard-button--ghost"
          >
            Limpar formulario
          </a>
        </div>
      </form>

    </article>
  );
}

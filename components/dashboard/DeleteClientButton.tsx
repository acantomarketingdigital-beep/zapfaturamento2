"use client";

export function DeleteClientButton({ slug, name }: { slug: string; name: string }) {
  function handleSubmit(e: React.FormEvent) {
    if (
      !confirm(
        `Deletar TODOS os dados de "${name}"?\n\nIsso inclui leads, campanhas, conversas e o cadastro do cliente.\n\nEssa acao nao tem como ser desfeita.`
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form
      action={`/api/admin/clients/${encodeURIComponent(slug)}/delete-all`}
      method="POST"
      onSubmit={handleSubmit}
    >
      <button type="submit" className="dashboard-button dashboard-button--danger">
        Deletar cliente
      </button>
    </form>
  );
}

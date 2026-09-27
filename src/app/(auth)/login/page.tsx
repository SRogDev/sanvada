export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="aurora" aria-hidden />
      <div className="grain" aria-hidden />
      <h1 className="font-heading text-glow text-4xl font-semibold tracking-tight">
        Iniciar sesión
      </h1>
      <p className="mt-3 leading-relaxed text-(--color-muted-foreground)">
        La autenticación con Supabase llega cuando conectes el proyecto. Nunca
        habrá claves de servicio en el cliente.
      </p>
    </main>
  );
}

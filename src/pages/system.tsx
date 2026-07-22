// Baseline system + static surfaces (folded from SYS-01): 404 / 500 / maintenance / Terms.
function SystemPage({ code, title, message }: { code?: string; title: string; message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6 text-center font-sans">
      <div>
        {code ? <p className="text-3xl font-black text-ink">{code}</p> : null}
        <h1 className="mt-2 text-xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-1 text-neutral-600">{message}</p>
      </div>
    </div>
  )
}

export function NotFound404() {
  return <SystemPage code="404" title="Page not found" message="That page doesn’t exist." />
}

export function ServerError500() {
  return <SystemPage code="500" title="Something went wrong" message="Please try again shortly." />
}

export function Maintenance() {
  return <SystemPage title="Down for maintenance" message="Youhue is briefly unavailable." />
}

export function Terms() {
  return (
    <div className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-2xl font-black text-ink">Terms of Service</h1>
      <p className="mt-4 text-neutral-700">
        Placeholder terms — the final legal copy is provided at go-live.
      </p>
    </div>
  )
}

/**
 * Forms — Field wrapper + Input, Textarea, Select. Presentational.
 */
import * as React from 'react'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs font-semibold text-neutral-700">{label}</label>
      {children}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-coral focus:shadow-focus focus:outline-none" {...props} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-[90px] w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-coral focus:shadow-focus focus:outline-none" {...props} />
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="w-full appearance-none rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[13px] text-neutral-700 focus:border-coral focus:shadow-focus focus:outline-none" {...props}>
      {children}
    </select>
  )
}

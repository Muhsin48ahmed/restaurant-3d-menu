type Values = { name: string; email: string; phone: string };
type Props = { values: Values; onChange: (field: keyof Values, value: string) => void };

/** Name, email and phone inputs shared by checkout and reservations. */
export function ContactFields({ values, onChange }: Props) {
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="name" className="label">Full name</label>
        <input
          id="name"
          className="field"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={values.name}
          onChange={(event) => onChange("name", event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          className="field"
          autoComplete="email"
          required
          maxLength={120}
          value={values.email}
          onChange={(event) => onChange("email", event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="phone" className="label">Phone</label>
        <input
          id="phone"
          type="tel"
          className="field"
          autoComplete="tel"
          required
          value={values.phone}
          onChange={(event) => onChange("phone", event.target.value)}
        />
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="border-l-2 border-danger bg-danger/5 px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

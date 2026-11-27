const prefix = "pv-inquiry-contact:";

export function transferEquipmentContact(form: HTMLFormElement) {
  const fields = new FormData(form);
  const contact = Object.fromEntries(["name", "email", "company"].map(field =>
    [field, String(fields.get(field) ?? "").trim().slice(0, 254)]));
  if (!Object.values(contact).some(Boolean)) return "";
  try {
    const key = crypto.randomUUID();
    sessionStorage.setItem(prefix + key, JSON.stringify({ contact, created: Date.now() }));
    return key;
  } catch { return ""; }
}

export function fillTransferredContact(form: HTMLFormElement) {
  const key = new URLSearchParams(location.search).get("handoff");
  if (!key || !/^[a-f\d-]{36}$/i.test(key)) return false;
  try {
    const raw = sessionStorage.getItem(prefix + key);
    if (!raw) return false;
    const { contact, created } = JSON.parse(raw);
    if (Date.now() - created > 30 * 60_000) {
      sessionStorage.removeItem(prefix + key);
      return false;
    }
    for (const field of ["name", "email", "company"]) {
      const input = form.elements.namedItem(field);
      if (input instanceof HTMLInputElement && typeof contact[field] === "string") input.value = contact[field];
    }
    return true;
  } catch { return false; }
}

export function projectRoute(address: string) { return `/app/project/?project=${encodeURIComponent(address)}`; }
export function agreementRoute(address: string) { return `/app/agreement/?project=${encodeURIComponent(address)}`; }

// Only project pages retain their section; dashboard/creation open Overview.
export function switchProjectRoute(section: string, address: string) {
  const page = ["agreement", "funding", "milestones", "payments", "governance", "audit"].includes(section) ? section : "project";
  return `/app/${page}/?project=${encodeURIComponent(address)}`;
}

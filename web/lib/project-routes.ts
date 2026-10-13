export function projectRoute(address: string) { return `/app/project/?project=${encodeURIComponent(address)}`; }
export function agreementRoute(address: string) { return `/app/agreement/?project=${encodeURIComponent(address)}`; }

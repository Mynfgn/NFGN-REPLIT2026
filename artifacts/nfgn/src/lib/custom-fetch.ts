export async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("nfgn_token");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

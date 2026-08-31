const request = {
    json: async <T>(url: string): Promise<T> => await (await fetch(url)).json() as T,
    buffer: async (url: string): Promise<Buffer> => Buffer.from(await (await fetch(url)).arrayBuffer())
}

export const post = async <T>(
    url: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    data: any,
    config?: { headers?: Record<string, string> }
): Promise<T extends null ? { [key: string]: string | number | boolean } : T> => {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(config?.headers || {}) },
        body: typeof data === 'string' ? data : JSON.stringify(data)
    })
    return await res.json() as T
}

export default request

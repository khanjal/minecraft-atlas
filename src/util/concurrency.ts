// A version's recipe folder is ~1,500 files - fetching them one at a time over HTTP is slow,
// fetching them all at once risks transient failures. A small fixed worker pool is enough; no
// need for a queueing library over something this simple.
export async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;

    async function worker(): Promise<void> {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index], index);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

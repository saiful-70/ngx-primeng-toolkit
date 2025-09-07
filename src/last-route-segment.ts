// Helper type to extract the last segment from a path string
type LastSegment<T extends string> = T extends `${string}/${infer Rest}` ? LastSegment<Rest> : T;

// Recursive type to get last route segments from strings in nested structures
type GetLastRouteSegment<T> = T extends string
  ? LastSegment<T>
  : T extends readonly (infer U)[]
    ? readonly GetLastRouteSegment<U>[]
    : T extends (infer U)[]
      ? GetLastRouteSegment<U>[]
      : T extends Record<string, any>
        ? { readonly [K in keyof T]: GetLastRouteSegment<T[K]> }
        : T;

export function lastRouteSegment<T>(obj: T): GetLastRouteSegment<T> {
  if (typeof obj === "string") {
    // Handle special case: if string is only "/" or whitespace, return empty string
    if (obj.trim() === "/" || obj.trim() === "") {
      return "" as GetLastRouteSegment<T>;
    }

    const segments = obj.split("/").filter(Boolean);

    // If no segments found, use the full string
    if (segments.length === 0) {
      return obj as GetLastRouteSegment<T>;
    }

    // If segments found, return the last one
    const lastSegment = segments.pop();
    return lastSegment as GetLastRouteSegment<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => lastRouteSegment(item)) as GetLastRouteSegment<T>;
  }

  if (typeof obj === "object" && obj !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = lastRouteSegment(value);
    }
    return result as GetLastRouteSegment<T>;
  }

  return obj as GetLastRouteSegment<T>;
}

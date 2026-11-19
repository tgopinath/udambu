// 3D text font is served locally (Latin subset) — no runtime font CDN requests. Absolute URL: troika
// loads it from a worker, where a relative path would not resolve against the Lab page.
export const FONT = new URL('fonts/inter-latin-600-normal.woff', typeof document !== 'undefined' ? document.baseURI : 'http://localhost/lab/').href

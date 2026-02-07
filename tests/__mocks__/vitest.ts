// Shim to allow vitest-authored tests to run under Jest
// Maps vitest API to Jest globals
export const describe = globalThis.describe
export const test = globalThis.test
export const it = globalThis.it
export const expect = globalThis.expect
export const beforeAll = globalThis.beforeAll
export const afterAll = globalThis.afterAll
export const beforeEach = globalThis.beforeEach
export const afterEach = globalThis.afterEach
export const vi = globalThis.jest

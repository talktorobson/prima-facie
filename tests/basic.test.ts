describe('Basic Setup Test', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have correct environment', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})
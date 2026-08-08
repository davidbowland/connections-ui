import config from '../next-sitemap.config.js'

describe('next-sitemap config', () => {
  it('points at the production domain', () => {
    expect(config.siteUrl).toEqual('https://connections.dbowland.com')
  })

  it('generates a robots.txt', () => {
    expect(config.generateRobotsTxt).toBe(true)
  })

  it('writes into the static export directory, so the current build deploys the current sitemap', () => {
    expect(config.outDir).toEqual('out')
  })

  it('excludes dated puzzle pages, including the __placeholder__ build artifact', () => {
    expect(config.exclude).toContain('/g/**')
  })

  it('excludes error pages', () => {
    expect(config.exclude).toEqual(expect.arrayContaining(['/400', '/403', '/404', '/500']))
  })
})

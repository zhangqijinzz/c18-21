import { describe, expect, it } from 'vitest'
import { INITIAL_TOKENS, type BrandMirrorSnapshot } from '../models/brandMirrorModels'
import { buildBrandGuidelinesMarkdown, buildExportFileName, buildExportSummary, countTokens } from '../services/exportService'

function makeSnapshot(overrides: Partial<BrandMirrorSnapshot> = {}): BrandMirrorSnapshot {
  return {
    status: 'ready',
    tokens: { ...INITIAL_TOKENS, radiusScale: [...INITIAL_TOKENS.radiusScale], spacingScale: [...INITIAL_TOKENS.spacingScale], typeScale: [...INITIAL_TOKENS.typeScale] },
    theme: 'studio',
    versions: [],
    compareMode: false,
    activeVersionId: null,
    contrastRatio: 4.2,
    contrastWarning: false,
    message: '',
    ...overrides,
  }
}

const savedVersions = [
  { id: 'version-1', label: 'Version A', tokens: { primary: '#F15A47', secondary: '#24324A', radiusScale: [8, 12, 18, 28], spacingScale: [4, 8, 12, 20, 32], typeScale: [12, 14, 16, 20, 28, 40] }, createdAt: '2026-09-28T08:00:00.000Z' },
  { id: 'version-2', label: 'Version B', tokens: { primary: '#238B73', secondary: '#173C35', radiusScale: [4, 8, 12, 18], spacingScale: [4, 8, 16, 24, 40], typeScale: [12, 14, 16, 22, 30, 44] }, createdAt: '2026-09-30T09:30:00.000Z' },
]

describe('brand guidelines export', () => {
  it('writes the readable theme name instead of the internal id', () => {
    const markdown = buildBrandGuidelinesMarkdown(makeSnapshot({ theme: 'night' }), { includeVersions: false, versionIds: [] })
    expect(markdown).toContain('当前主题：Night signal（night）')
    expect(markdown).not.toContain('当前主题：night\n')
  })

  it('includes the complete token table with radius, spacing and type values', () => {
    const markdown = buildBrandGuidelinesMarkdown(makeSnapshot(), { includeVersions: false, versionIds: [] })
    expect(markdown).toContain('| `color.primary` | 主色 | `#F15A47` |')
    expect(markdown).toContain('| `radius.4` | 圆角 4 | `28px` |')
    expect(markdown).toContain('| `spacing.5` | 间距 5 | `32px` |')
    expect(markdown).toContain('| `type.6` | 字体 6 | `40px` |')
    expect(markdown).toContain('导出范围：仅当前令牌')
  })

  it('writes selected versions with their full token tables', () => {
    const snapshot = makeSnapshot({ versions: savedVersions })
    const markdown = buildBrandGuidelinesMarkdown(snapshot, { includeVersions: true, versionIds: ['version-2'] })
    expect(markdown).toContain('导出范围：当前令牌 + 1 个保存版本')
    expect(markdown).toContain('### Version B · 2026-09-30')
    expect(markdown).toContain('| `radius.3` | 圆角 3 | `12px` |')
    expect(markdown).toContain('| `spacing.4` | 间距 4 | `24px` |')
    expect(markdown).toContain('| `type.5` | 字体 5 | `30px` |')
    expect(markdown).not.toContain('Version A')
  })

  it('omits the versions section when the scope is current tokens only', () => {
    const snapshot = makeSnapshot({ versions: savedVersions })
    const markdown = buildBrandGuidelinesMarkdown(snapshot, { includeVersions: false, versionIds: [] })
    expect(markdown).not.toContain('## 保存版本')
    expect(markdown).not.toContain('Version A')
  })

  it('builds a file name that shows brand, theme and date', () => {
    const snapshot = makeSnapshot({ theme: 'editorial' })
    expect(buildExportFileName(snapshot, new Date('2026-10-02T10:00:00.000Z'))).toBe('BrandMirror-editorial-green-2026-10-02.md')
  })

  it('summarizes what will be exported for the confirmation preview', () => {
    const snapshot = makeSnapshot({ versions: savedVersions })
    const summary = buildExportSummary(snapshot, { includeVersions: true, versionIds: ['version-1', 'version-2'] })
    expect(summary.tokenCount).toBe(17)
    expect(summary.themeLabel).toBe('Studio warm')
    expect(summary.versions.map((version) => version.label)).toEqual(['Version A', 'Version B'])
    expect(summary.scopeDescription).toBe('当前令牌 + 2 个保存版本')
    expect(summary.fileName).toMatch(/^BrandMirror-studio-warm-\d{4}-\d{2}-\d{2}\.md$/)
  })

  it('counts every token in the system', () => {
    expect(countTokens(INITIAL_TOKENS)).toBe(17)
  })
})

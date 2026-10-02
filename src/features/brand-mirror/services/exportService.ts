import { THEME_PRESETS, type BrandMirrorSnapshot, type BrandTokens, type SavedVersion } from '../models/brandMirrorModels'

export interface BrandGuidelinesOptions {
  includeVersions: boolean
  versionIds: string[]
}

export interface BrandGuidelinesExporter {
  export(snapshot: BrandMirrorSnapshot, options: BrandGuidelinesOptions): void
}

export interface BrandGuidelinesSummary {
  fileName: string
  themeLabel: string
  tokenCount: number
  versions: SavedVersion[]
  scopeDescription: string
}

export function resolveExportVersions(snapshot: BrandMirrorSnapshot, options: BrandGuidelinesOptions): SavedVersion[] {
  if (!options.includeVersions) return []
  return snapshot.versions.filter((version) => options.versionIds.includes(version.id))
}

export function countTokens(tokens: BrandTokens): number {
  return 2 + tokens.radiusScale.length + tokens.spacingScale.length + tokens.typeScale.length
}

export function buildExportFileName(snapshot: BrandMirrorSnapshot, date: Date = new Date()): string {
  const themeSlug = THEME_PRESETS[snapshot.theme].label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `BrandMirror-${themeSlug}-${date.toISOString().slice(0, 10)}.md`
}

export function buildExportSummary(snapshot: BrandMirrorSnapshot, options: BrandGuidelinesOptions): BrandGuidelinesSummary {
  const versions = resolveExportVersions(snapshot, options)
  return {
    fileName: buildExportFileName(snapshot),
    themeLabel: THEME_PRESETS[snapshot.theme].label,
    tokenCount: countTokens(snapshot.tokens),
    versions,
    scopeDescription: versions.length > 0 ? `当前令牌 + ${versions.length} 个保存版本` : '仅当前令牌',
  }
}

function tokenRows(tokens: BrandTokens): { key: string; label: string; value: string }[] {
  return [
    { key: 'color.primary', label: '主色', value: tokens.primary },
    { key: 'color.secondary', label: '辅助色', value: tokens.secondary },
    ...tokens.radiusScale.map((value, index) => ({ key: `radius.${index + 1}`, label: `圆角 ${index + 1}`, value: `${value}px` })),
    ...tokens.spacingScale.map((value, index) => ({ key: `spacing.${index + 1}`, label: `间距 ${index + 1}`, value: `${value}px` })),
    ...tokens.typeScale.map((value, index) => ({ key: `type.${index + 1}`, label: `字体 ${index + 1}`, value: `${value}px` })),
  ]
}

function tokenTable(tokens: BrandTokens): string {
  const rows = tokenRows(tokens).map((row) => `| \`${row.key}\` | ${row.label} | \`${row.value}\` |`).join('\n')
  return `| 令牌 | 名称 | 值 |\n| --- | --- | --- |\n${rows}`
}

export function buildBrandGuidelinesMarkdown(snapshot: BrandMirrorSnapshot, options: BrandGuidelinesOptions): string {
  const summary = buildExportSummary(snapshot, options)
  const themeLabel = THEME_PRESETS[snapshot.theme].label
  const exportDate = new Date().toISOString().slice(0, 10)
  const versionSections = summary.versions.map((version) => `### ${version.label} · ${version.createdAt.slice(0, 10)}\n\n${tokenTable(version.tokens)}`).join('\n\n')
  const versionsSection = summary.versions.length === 0 ? '' : `\n## 保存版本\n\n${versionSections}\n`
  return `# BrandMirror 品牌规范

> 导出时间：${exportDate}
> 当前主题：${themeLabel}（${snapshot.theme}）
> 导出范围：${summary.scopeDescription}

## 设计令牌

${tokenTable(snapshot.tokens)}

对比度：${snapshot.contrastRatio.toFixed(1)}:1（主色 / 辅助色）
${versionsSection}
---
由 BrandMirror 品牌视觉实验室生成。
`
}

export class BrowserBrandGuidelinesExporter implements BrandGuidelinesExporter {
  export(snapshot: BrandMirrorSnapshot, options: BrandGuidelinesOptions): void {
    const content = buildBrandGuidelinesMarkdown(snapshot, options)
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = buildExportFileName(snapshot)
    link.click()
    URL.revokeObjectURL(url)
  }
}

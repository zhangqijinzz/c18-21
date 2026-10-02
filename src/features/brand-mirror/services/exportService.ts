import { contrastRatio } from '../domain/brandRules'
import { THEME_PRESETS, type BrandTheme, type BrandTokens, type ExportEntry, type ExportPlan, type ExportScope, type ExportSections, type SavedVersion } from '../models/brandMirrorModels'

export type { ExportEntry, ExportPlan, ExportScope, ExportSections } from '../models/brandMirrorModels'

export const BRAND_NAME = 'BrandMirror'

export interface ExportRequest {
  scope: ExportScope
  sections: ExportSections
  theme: BrandTheme
  tokens: BrandTokens
  versions: SavedVersion[]
  exportedAt?: Date
}

export const ALL_EXPORT_SECTIONS: ExportSections = { colors: true, radius: true, spacing: true, type: true, versions: true }

export function themeDisplayName(theme: BrandTheme | undefined, fallback = '自定义主题'): string {
  return theme ? THEME_PRESETS[theme].label : fallback
}

/** 根据令牌匹配内置主题；保存时未记录主题的旧版本用它回填可读名称 */
export function inferTheme(tokens: BrandTokens): BrandTheme | undefined {
  return (Object.keys(THEME_PRESETS) as BrandTheme[]).find((theme) => shallowEqualTokens(THEME_PRESETS[theme].tokens, tokens))
}

export function scopeLabel(scope: ExportScope, versionCount: number): string {
  if (scope === 'current') return '当前工作区'
  if (scope === 'latest') return '最新保存版本'
  return `全部 ${versionCount} 个保存版本`
}

/** latest / all 范围在没有保存版本时无法导出 */
export function isExportRequestValid(request: ExportRequest): boolean {
  return request.scope === 'current' || request.versions.length > 0
}

export function buildExportPlan(request: ExportRequest): ExportPlan {
  const exportedAt = request.exportedAt ?? new Date()
  const datePart = exportedAt.toISOString().slice(0, 10)
  const entries = resolveEntries(request)
  const versionList = request.sections.versions && request.scope === 'current' ? request.versions : []
  const label = scopeLabel(request.scope, request.versions.length)
  const sectionsMarkdown = entries.map((entry) => renderEntry(entry, request.sections)).join('\n\n---\n\n')
  const markdown = [
    renderHeader(label, entries.length, exportedAt),
    sectionsMarkdown,
    renderVersionList(versionList),
    `---\n由 ${BRAND_NAME} 品牌视觉实验室生成。`,
  ].filter(Boolean).join('\n\n')

  return {
    scope: request.scope,
    scopeLabel: label,
    fileName: `${BRAND_NAME}-品牌规范-${scopeSlug(request.scope)}-${datePart}.md`,
    entries,
    versionList,
    markdown,
  }
}

function resolveEntries(request: ExportRequest): ExportEntry[] {
  if (request.scope === 'latest' || request.scope === 'all') {
    const picked = request.scope === 'latest' ? request.versions.slice(-1) : request.versions
    return picked.map((version) => ({
      title: version.label,
      themeName: themeDisplayName(version.theme ?? inferTheme(version.tokens)),
      customized: false,
      createdAt: version.createdAt.slice(0, 10),
      tokens: version.tokens,
    }))
  }
  return [{
    title: '当前工作区',
    themeName: themeDisplayName(request.theme),
    customized: !shallowEqualTokens(THEME_PRESETS[request.theme].tokens, request.tokens),
    createdAt: new Date().toISOString().slice(0, 10),
    tokens: request.tokens,
  }]
}

function shallowEqualTokens(first: BrandTokens, second: BrandTokens): boolean {
  return first.primary === second.primary
    && first.secondary === second.secondary
    && JSON.stringify(first.radiusScale) === JSON.stringify(second.radiusScale)
    && JSON.stringify(first.spacingScale) === JSON.stringify(second.spacingScale)
    && JSON.stringify(first.typeScale) === JSON.stringify(second.typeScale)
}

function renderHeader(scopeLabelText: string, entryCount: number, exportedAt: Date): string {
  const scopeLine = entryCount > 1 ? `> 导出范围：${scopeLabelText}（本文件含 ${entryCount} 个版本）` : `> 导出范围：${scopeLabelText}`
  return `# ${BRAND_NAME} 品牌规范\n\n> 导出时间：${exportedAt.toISOString().slice(0, 10)}\n${scopeLine}`
}

function renderEntry(entry: ExportEntry, sections: ExportSections): string {
  const blocks: string[] = [
    `## 规范版本：${entry.title}\n\n- 主题：${entry.themeName}${entry.customized ? '（已在预设基础上自定义调整）' : ''}\n- 版本日期：${entry.createdAt}`,
  ]
  if (sections.colors) blocks.push(renderColors(entry.tokens))
  if (sections.radius) blocks.push(renderScale('圆角尺度', 'radius', entry.tokens.radiusScale))
  if (sections.spacing) blocks.push(renderScale('间距体系', 'spacing', entry.tokens.spacingScale))
  if (sections.type) blocks.push(renderScale('字体比例', 'type', entry.tokens.typeScale))
  return blocks.join('\n\n')
}

function renderColors(tokens: BrandTokens): string {
  return [
    '### 品牌色',
    '',
    '| 令牌 | 说明 | 值 |',
    '| --- | --- | --- |',
    `| \`color.primary\` | 主色 | \`${tokens.primary}\` |`,
    `| \`color.secondary\` | 辅助色 | \`${tokens.secondary}\` |`,
    `| 对比度 | 主色 / 辅助色 | ${contrastRatio(tokens.primary, tokens.secondary).toFixed(1)}:1 |`,
  ].join('\n')
}

function renderScale(title: string, tokenPrefix: string, values: number[]): string {
  const rows = values.map((value, index) => `| \`${tokenPrefix}.${index + 1}\` | 第 ${index + 1} 级 | ${value}px |`).join('\n')
  return [`### ${title}`, '', '| 令牌 | 层级 | 值 |', '| --- | --- | --- |', rows].join('\n')
}

function renderVersionList(versions: SavedVersion[]): string {
  if (versions.length === 0) return ''
  const rows = versions
    .map((version) => `| ${version.label} | ${themeDisplayName(version.theme ?? inferTheme(version.tokens))} | ${version.createdAt.slice(0, 10)} | \`${version.tokens.primary}\` | \`${version.tokens.secondary}\` |`)
    .join('\n')
  return `## 保存版本清单\n\n| 版本 | 主题 | 保存日期 | 主色 | 辅助色 |\n| --- | --- | --- | --- | --- |\n${rows}`
}

function scopeSlug(scope: ExportScope): string {
  if (scope === 'latest') return 'latest'
  if (scope === 'all') return 'all-versions'
  return 'current'
}

/** 向后兼容的便捷函数：导出当前工作区的完整规范 */
export function buildBrandGuidelinesMarkdown(snapshot: { theme: BrandTheme; tokens: BrandTokens; versions: SavedVersion[] }): string {
  return buildExportPlan({
    scope: 'current',
    sections: ALL_EXPORT_SECTIONS,
    theme: snapshot.theme,
    tokens: snapshot.tokens,
    versions: snapshot.versions,
  }).markdown
}

export interface BrandGuidelinesExporter {
  export(markdown: string, fileName: string): void
}

export class BrowserBrandGuidelinesExporter implements BrandGuidelinesExporter {
  export(markdown: string, fileName: string): void {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }
}

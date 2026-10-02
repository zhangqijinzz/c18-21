export type BrandTheme = 'studio' | 'editorial' | 'night'
export type MirrorStatus = 'loading' | 'ready' | 'editing' | 'error'

/** 导出范围：当前工作区 / 最新保存版本 / 全部保存版本 */
export type ExportScope = 'current' | 'latest' | 'all'

export interface ExportSections {
  colors: boolean
  radius: boolean
  spacing: boolean
  type: boolean
  versions: boolean
}

export interface ExportEntry {
  title: string
  themeName: string
  /** 主题预设是否被手动调整过（仅当前工作区可能出现） */
  customized: boolean
  createdAt: string
  tokens: BrandTokens
}

export interface ExportPlan {
  scope: ExportScope
  scopeLabel: string
  fileName: string
  /** 实际会被完整写入文档的版本（当前工作区或保存版本） */
  entries: ExportEntry[]
  /** 文档末尾“保存版本清单”中的版本 */
  versionList: SavedVersion[]
  markdown: string
}

export interface BrandTokens {
  primary: string
  secondary: string
  radiusScale: number[]
  spacingScale: number[]
  typeScale: number[]
}

export interface SavedVersion {
  id: string
  label: string
  tokens: BrandTokens
  theme?: BrandTheme
  createdAt: string
}

export interface BrandDocument {
  version: 1
  tokens: BrandTokens
  theme: BrandTheme
  versions: SavedVersion[]
}

export interface BrandMirrorSnapshot {
  status: MirrorStatus
  tokens: BrandTokens
  theme: BrandTheme
  versions: SavedVersion[]
  compareMode: boolean
  activeVersionId: string | null
  contrastRatio: number
  contrastWarning: boolean
  message: string
  exportDialogOpen: boolean
  exportScope: ExportScope
  exportSections: ExportSections
  exportPlan: ExportPlan | null
}

export const INITIAL_TOKENS: BrandTokens = {
  primary: '#F15A47',
  secondary: '#24324A',
  radiusScale: [8, 12, 18, 28],
  spacingScale: [4, 8, 12, 20, 32],
  typeScale: [12, 14, 16, 20, 28, 40],
}

export const THEME_PRESETS: Record<BrandTheme, { label: string; tokens: BrandTokens }> = {
  studio: {
    label: 'Studio warm',
    tokens: INITIAL_TOKENS,
  },
  editorial: {
    label: 'Editorial green',
    tokens: {
      primary: '#238B73', secondary: '#173C35', radiusScale: [4, 8, 12, 18], spacingScale: [4, 8, 16, 24, 40], typeScale: [12, 14, 16, 22, 30, 44],
    },
  },
  night: {
    label: 'Night signal',
    tokens: {
      primary: '#A98BFF', secondary: '#191829', radiusScale: [6, 10, 14, 22], spacingScale: [4, 8, 12, 18, 28], typeScale: [12, 14, 16, 20, 28, 38],
    },
  },
}

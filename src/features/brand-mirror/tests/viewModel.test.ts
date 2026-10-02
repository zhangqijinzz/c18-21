import { describe, expect, it } from 'vitest'
import { BrandMirrorViewModel } from '../viewmodels/brandMirrorViewModel'
import type { BrandDocument } from '../models/brandMirrorModels'
import type { BrandRepository } from '../repositories/brandRepository'
import type { BrandGuidelinesExporter } from '../services/exportService'

class MemoryRepository implements BrandRepository {
  document: BrandDocument | null = null
  shouldFail = false
  load(): BrandDocument | null { return this.document }
  save(document: BrandDocument): void { if (this.shouldFail) throw new Error('offline'); this.document = document }
}

class MemoryExporter implements BrandGuidelinesExporter {
  received: { markdown: string; fileName: string } | null = null
  export(markdown: string, fileName: string): void { this.received = { markdown, fileName } }
}

describe('BrandMirrorViewModel', () => {
  it('initializes, updates tokens and persists the latest state', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.updateColor('primary', '#123456')
    viewModel.updateScale('typeScale', 0, 18)
    expect(viewModel.getSnapshot().tokens.primary).toBe('#123456')
    expect(viewModel.getSnapshot().tokens.typeScale[0]).toBe(18)
    expect(repository.document?.tokens.primary).toBe('#123456')
  })

  it('saves two versions and enters comparison mode', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.saveVersion()
    viewModel.updateColor('primary', '#238B73')
    viewModel.saveVersion()
    viewModel.toggleCompare()
    expect(viewModel.getSnapshot().versions.map((version) => version.label)).toEqual(['Version A', 'Version B'])
    expect(viewModel.getSnapshot().compareMode).toBe(true)
  })

  it('records the readable theme when saving a version', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    viewModel.selectTheme('night')
    viewModel.saveVersion()
    expect(repository.document?.versions[0].theme).toBe('night')
  })

  it('keeps editing usable when persistence fails', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    repository.shouldFail = true
    viewModel.updateColor('secondary', '#FFFFFF')
    expect(viewModel.getSnapshot().status).toBe('error')
    expect(viewModel.getSnapshot().tokens.secondary).toBe('#FFFFFF')
  })

  it('recovers a previously persisted document on initialization', () => {
    const repository = new MemoryRepository()
    repository.document = { version: 1, theme: 'night', tokens: { primary: '#A98BFF', secondary: '#191829', radiusScale: [6, 10, 14, 22], spacingScale: [4, 8, 12, 18, 28], typeScale: [12, 14, 16, 20, 28, 38] }, versions: [] }
    const viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    expect(viewModel.getSnapshot().theme).toBe('night')
    expect(viewModel.getSnapshot().message).toContain('恢复')
  })

  it('opens the export dialog with a full preview of the current workspace', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository, new MemoryExporter())
    viewModel.initialize()
    viewModel.openExportDialog()
    const snapshot = viewModel.getSnapshot()
    expect(snapshot.exportDialogOpen).toBe(true)
    expect(snapshot.exportPlan).not.toBeNull()
    expect(snapshot.exportPlan?.scopeLabel).toBe('当前工作区')
    expect(snapshot.exportPlan?.fileName).toMatch(/^BrandMirror-品牌规范-current-\d{4}-\d{2}-\d{2}\.md$/)
    expect(snapshot.exportPlan?.markdown).toContain('Studio warm')
    expect(snapshot.exportPlan?.markdown).toContain('`color.primary`')
    expect(snapshot.exportPlan?.markdown).toContain('12px')
  })

  it('cannot select a saved-version scope before any version exists', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository, new MemoryExporter())
    viewModel.initialize()
    viewModel.openExportDialog()
    viewModel.selectExportScope('latest')
    expect(viewModel.getSnapshot().exportScope).toBe('current')
  })

  it('exports the chosen scope through the exporter with a brand and date filename', () => {
    const repository = new MemoryRepository()
    const exporter = new MemoryExporter()
    const viewModel = new BrandMirrorViewModel(repository, exporter)
    viewModel.initialize()
    viewModel.saveVersion()
    viewModel.updateColor('primary', '#238B73')
    viewModel.saveVersion()
    viewModel.openExportDialog()
    viewModel.selectExportScope('latest')
    expect(viewModel.getSnapshot().exportPlan?.scopeLabel).toBe('最新保存版本')
    viewModel.confirmExport()
    expect(exporter.received).not.toBeNull()
    expect(exporter.received?.fileName).toMatch(/^BrandMirror-品牌规范-latest-\d{4}-\d{2}-\d{2}\.md$/)
    expect(exporter.received?.markdown).toContain('Version B')
    expect(exporter.received?.markdown).toContain('`spacing.5`')
    expect(viewModel.getSnapshot().message).toContain('最新保存版本')
    expect(viewModel.getSnapshot().exportDialogOpen).toBe(false)
  })

  it('keeps at least one content section selected in the export dialog', () => {
    const repository = new MemoryRepository()
    const viewModel = new BrandMirrorViewModel(repository, new MemoryExporter())
    viewModel.initialize()
    viewModel.openExportDialog()
    viewModel.toggleExportSection('colors')
    viewModel.toggleExportSection('radius')
    viewModel.toggleExportSection('spacing')
    viewModel.toggleExportSection('versions')
    // 只剩 type 时，不允许再取消
    viewModel.toggleExportSection('type')
    expect(viewModel.getSnapshot().exportSections.type).toBe(true)
  })
})

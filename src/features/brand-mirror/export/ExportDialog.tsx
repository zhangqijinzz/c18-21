import { useMemo, useState } from 'react'
import type { BrandMirrorSnapshot } from '../models/brandMirrorModels'
import { buildExportSummary, type BrandGuidelinesOptions } from '../services/exportService'

interface ExportDialogProps {
  snapshot: BrandMirrorSnapshot
  onCancel: () => void
  onConfirm: (options: BrandGuidelinesOptions) => void
}

export function ExportDialog({ snapshot, onCancel, onConfirm }: ExportDialogProps) {
  const hasVersions = snapshot.versions.length > 0
  const [includeVersions, setIncludeVersions] = useState(hasVersions)
  const [selectedIds, setSelectedIds] = useState<string[]>(snapshot.versions.map((version) => version.id))

  const options = useMemo<BrandGuidelinesOptions>(() => ({ includeVersions, versionIds: selectedIds }), [includeVersions, selectedIds])
  const summary = buildExportSummary(snapshot, options)
  const canConfirm = !includeVersions || selectedIds.length > 0

  const toggleVersion = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]))
  }

  return (
    <div className="export-backdrop" role="presentation" onClick={onCancel}>
      <div className="export-dialog" role="dialog" aria-modal="true" aria-label="导出品牌规范" onClick={(event) => event.stopPropagation()}>
        <div className="export-dialog-head">
          <div>
            <span className="eyebrow">EXPORT</span>
            <h3>导出品牌规范</h3>
          </div>
          <button className="export-close" type="button" aria-label="关闭导出对话框" onClick={onCancel}>×</button>
        </div>

        <div className="export-section">
          <div className="section-label"><span>导出范围</span></div>
          <label className="export-scope-option">
            <input type="radio" name="export-scope" checked={!includeVersions} onChange={() => setIncludeVersions(false)} />
            <span><strong>仅当前令牌</strong><small>只导出当前编辑中的完整令牌表</small></span>
          </label>
          <label className={`export-scope-option ${hasVersions ? '' : 'disabled'}`}>
            <input type="radio" name="export-scope" disabled={!hasVersions} checked={includeVersions} onChange={() => setIncludeVersions(true)} />
            <span><strong>当前令牌 + 保存版本</strong><small>{hasVersions ? `从 ${snapshot.versions.length} 个保存版本中选择` : '暂无保存版本'}</small></span>
          </label>
        </div>

        {includeVersions && hasVersions && (
          <div className="export-section">
            <div className="section-label"><span>选择版本</span><span className="muted">{selectedIds.length} / {snapshot.versions.length}</span></div>
            <div className="export-version-list">
              {snapshot.versions.map((version) => (
                <label className="export-version-option" key={version.id}>
                  <input type="checkbox" checked={selectedIds.includes(version.id)} onChange={() => toggleVersion(version.id)} />
                  <span><strong>{version.label}</strong><small>{version.createdAt.slice(0, 10)} · 主色 {version.tokens.primary}</small></span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="export-section export-preview">
          <div className="section-label"><span>导出内容预览</span><span className="muted">{summary.scopeDescription}</span></div>
          <ul className="export-preview-list">
            <li><span>文件名</span><code>{summary.fileName}</code></li>
            <li><span>主题</span><strong>{summary.themeLabel}</strong></li>
            <li><span>令牌表</span><strong>{summary.tokenCount} 项（颜色 / 圆角 / 间距 / 字体）</strong></li>
            <li><span>保存版本</span><strong>{summary.versions.length > 0 ? summary.versions.map((version) => version.label).join('、') : '不包含'}</strong></li>
          </ul>
        </div>

        <div className="export-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>取消</button>
          <button className="primary-button" type="button" disabled={!canConfirm} onClick={() => onConfirm(options)}>确认导出</button>
        </div>
      </div>
    </div>
  )
}

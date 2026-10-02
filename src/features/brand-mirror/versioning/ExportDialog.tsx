import { useEffect } from 'react'
import type { BrandMirrorSnapshot, ExportSections, ExportScope } from '../models/brandMirrorModels'

interface ExportDialogProps {
  snapshot: BrandMirrorSnapshot
  onClose: () => void
  onScopeChange: (scope: ExportScope) => void
  onSectionToggle: (section: keyof ExportSections) => void
  onConfirm: () => void
}

const SCOPE_OPTIONS: { id: ExportScope; label: string; hint: string }[] = [
  { id: 'current', label: '当前工作区', hint: '导出正在编辑的完整令牌（含未保存改动）' },
  { id: 'latest', label: '最新保存版本', hint: '只导出最近一次保存的版本' },
  { id: 'all', label: '全部保存版本', hint: '每个保存版本都带完整令牌表' },
]

const SECTION_OPTIONS: { id: keyof ExportSections; label: string }[] = [
  { id: 'colors', label: '品牌色（含对比度）' },
  { id: 'radius', label: '圆角尺度' },
  { id: 'spacing', label: '间距体系' },
  { id: 'type', label: '字体比例（字号）' },
  { id: 'versions', label: '保存版本清单' },
]

export function ExportDialog({ snapshot, onClose, onScopeChange, onSectionToggle, onConfirm }: ExportDialogProps) {
  const plan = snapshot.exportPlan
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="export-overlay" role="presentation" onClick={onClose}>
      <div className="export-dialog" role="dialog" aria-modal="true" aria-label="导出品牌规范" onClick={(event) => event.stopPropagation()}>
        <div className="export-dialog-head">
          <div>
            <span className="eyebrow">EXPORT / 导出预览</span>
            <h2>导出品牌规范</h2>
          </div>
          <button className="export-close" type="button" aria-label="关闭" onClick={onClose}>×</button>
        </div>

        <div className="export-dialog-body">
          <section className="export-field">
            <div className="section-label"><span>1. 选择导出范围</span></div>
            <div className="export-scope-list">
              {SCOPE_OPTIONS.map((option) => {
                const disabled = option.id !== 'current' && snapshot.versions.length === 0
                const selected = snapshot.exportScope === option.id
                return (
                  <label key={option.id} className={`export-scope-option ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
                    <input type="radio" name="export-scope" checked={selected} disabled={disabled} onChange={() => onScopeChange(option.id)} />
                    <span><strong>{option.label}</strong><small>{disabled ? '还没有保存版本' : option.hint}</small></span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="export-field">
            <div className="section-label"><span>2. 选择文档内容</span></div>
            <div className="export-section-toggles">
              {SECTION_OPTIONS.map((option) => {
                const disabledByScope = option.id === 'versions' && snapshot.exportScope !== 'current'
                const checked = snapshot.exportSections[option.id] && !disabledByScope
                return (
                  <label key={option.id} className={`export-toggle ${disabledByScope ? 'disabled' : ''}`}>
                    <input type="checkbox" checked={checked} disabled={disabledByScope} onChange={() => onSectionToggle(option.id)} />
                    <span>{option.label}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="export-field">
            <div className="section-label"><span>3. 确认将要导出的内容</span></div>
            {plan ? (
              <div className="export-summary">
                <div className="export-summary-row">
                  <span>导出范围</span><strong>{plan.scopeLabel}</strong>
                </div>
                <div className="export-summary-row">
                  <span>规范版本</span>
                  <strong>
                    {plan.entries.map((entry) => `${entry.title}（${entry.themeName}）`).join('、')}
                  </strong>
                </div>
                <div className="export-summary-row">
                  <span>每版令牌数</span>
                  <strong>{tokenCount(snapshot.exportSections)} 项</strong>
                </div>
                <div className="export-summary-row">
                  <span>版本清单</span>
                  <strong>{plan.versionList.length > 0 ? `附表列出 ${plan.versionList.length} 个版本` : '不包含'}</strong>
                </div>
                <div className="export-summary-row filename">
                  <span>文件名</span><code>{plan.fileName}</code>
                </div>
                <pre className="export-preview" aria-label="导出内容预览">{plan.markdown}</pre>
              </div>
            ) : (
              <div className="export-empty">该范围暂无可导出的版本，请先保存版本或选择“当前工作区”。</div>
            )}
          </section>
        </div>

        <div className="export-dialog-foot">
          <button className="secondary-button" type="button" onClick={onClose}>取消</button>
          <button className="export-confirm-button" type="button" disabled={!plan} onClick={onConfirm}>
            ↓ 确认导出{plan ? `（${plan.scopeLabel}）` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

function tokenCount(sections: ExportSections): number {
  return (sections.colors ? 3 : 0) + (sections.radius ? 4 : 0) + (sections.spacing ? 5 : 0) + (sections.type ? 6 : 0)
}

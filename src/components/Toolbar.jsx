export default function Toolbar({ onExport, onImportClick, fileInputRef, onImport }) {
  return (
    <div className="toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={onImport}
        style={{ display: 'none' }}
      />
    </div>
  )
}

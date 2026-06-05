import { SaveControls } from './SaveControls'

export function StickySaveBar() {
  return (
    <div className="sticky bottom-0 z-40 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-end">
        <SaveControls />
      </div>
    </div>
  )
}

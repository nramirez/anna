import { ArrowDownCircleIcon } from '@heroicons/react/20/solid'

export const CallToAction = ({
  text,
  shouldShow,
}: {
  text: string
  shouldShow: boolean
}) => {
  // keep same space when not showing
  if (!shouldShow) return <div style={{ height: '64px' }}></div>
  return (
    <div className="animate-bounce">
      <span className={'caption-text pb-2 text-slate-500'}>{text}</span>
      <div className="mx-auto flex h-10 w-10 rounded-full bg-white p-2 shadow-lg ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-slate-200/20">
        <ArrowDownCircleIcon className="h-6 w-6 text-violet-500" />
      </div>
    </div>
  )
}

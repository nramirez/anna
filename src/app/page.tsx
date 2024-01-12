import { Waveform } from './components/waveform'
import { MiddleContainer } from './components/middle'
import { welcomeData } from './services/history'

export default async function Home() {
  const { welcomeMessageId } = await welcomeData()
  return (
    <main className="relative flex h-full items-center justify-center dark:bg-gray-950">
      <Waveform className="absolute left-0 top-0 h-20 w-full " />
      <div className="flex h-full w-full flex-col justify-between">
        <div></div>
        <MiddleContainer
          welcomeKey={welcomeMessageId}
        />
      </div>
    </main>
  )
}

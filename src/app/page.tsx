import { Waveform } from "./components/waveform";

export default function Home() {
  return (
    <main className="relative flex h-full items-center justify-center dark:bg-gray-950">
      <Waveform className="absolute left-0 top-0 h-20 w-full " />
      <div className="flex h-full w-full flex-col justify-between">
        <div></div>
        <div className="flex h-full flex-col justify-between">
          <div></div>
          <div>
          </div>
        </div>
      </div>
    </main>
  );
}

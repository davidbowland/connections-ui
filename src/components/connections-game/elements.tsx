import { Button, Skeleton } from '@heroui/react'
import { motion } from 'framer-motion'
import React from 'react'

import { BrandMark } from '@components/brand-mark'
import { solvedCardInk } from '@config/contrast'
import { GameColor } from '@types'

const ease = [0.32, 0.72, 0, 1] as const

const rgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export const GameWrapper = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="px-4 pb-16 pt-8 md:pb-20 md:pt-14">{children}</div>
)

export const GameTitle = (): React.ReactNode => (
  <h1 className="mb-3 flex flex-col items-center justify-center gap-2 text-center text-2xl font-light uppercase tracking-[0.2em] text-black/[0.88] dark:text-white/90 min-[380px]:flex-row min-[380px]:gap-3 sm:text-3xl sm:tracking-[0.3em] md:text-5xl">
    <BrandMark className="h-6 w-6 sm:h-8 sm:w-8 md:h-11 md:w-11" />
    Common Threads
  </h1>
)

export const GameSubtitle = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="mb-4 flex justify-center">
    <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-black/60 dark:bg-white/[0.06] dark:text-white/55">
      {children}
    </span>
  </div>
)

export const GameInstructions = (): React.ReactNode => (
  <p className="mb-8 text-center text-[11px] tracking-wide text-black/60 dark:text-white/55">
    Find four groups of four words that belong together.
  </p>
)

export const BoardContainer = ({
  children,
  ref,
}: {
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}): React.ReactNode => (
  <div className="relative mx-auto mt-4 max-w-[560px] md:mt-6" ref={ref}>
    {children}
  </div>
)

export const SolvedCategoryCard = ({
  color,
  description,
  words,
}: {
  color: GameColor
  description: string
  words: string[]
}): React.ReactNode => {
  const ink = solvedCardInk(color.background)
  return (
    <div
      className="mb-2 rounded-xl p-[2px]"
      style={{ backgroundColor: `rgba(${rgb(color.background)},var(--card-bg-outer-a))` }}
    >
      <div
        className="rounded-[10px] px-5 py-3 text-center text-[var(--card-ink-light)] dark:text-[var(--card-ink-dark)]"
        style={
          {
            '--card-ink-dark': ink.dark,
            '--card-ink-light': ink.light,
            backgroundColor: `rgba(${rgb(color.background)},var(--card-bg-inner-a))`,
          } as React.CSSProperties
        }
      >
        <p className="text-xs font-bold uppercase tracking-widest">{description}</p>
        <p className="mt-1 text-xs font-light tracking-wide">{words.join(' · ')}</p>
      </div>
    </div>
  )
}

export const HintsContainer = ({
  children,
  ref,
}: {
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}): React.ReactNode => (
  <div className="mb-2 mt-4" ref={ref}>
    {children}
  </div>
)

export const HintCard = ({ hint }: { hint: string }): React.ReactNode => (
  <div className="mb-3 flex items-start gap-3 rounded-xl border border-violet-400/25 bg-violet-500/[0.07] px-4 py-3">
    <span
      aria-hidden="true"
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-violet-400/35 text-[10px] text-violet-600 dark:text-purple-200/70"
    >
      ?
    </span>
    <p className="text-sm leading-relaxed text-violet-800 dark:text-purple-200/85">{hint}</p>
  </div>
)

export const WordGrid = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <motion.div className="grid grid-cols-2 gap-1.5 md:grid-cols-4" layout>
    {children}
  </motion.div>
)

export const WordTile = ({
  isSelected,
  isShaking,
  onPress,
  selectedColor,
  word,
}: {
  isSelected: boolean
  isShaking: boolean
  onPress: () => void
  selectedColor: GameColor
  word: string
}): React.ReactNode => (
  <motion.div
    exit={{ opacity: 0, scale: 0.9, y: -12, transition: { duration: 0.32, ease } }}
    layout
    transition={{ layout: { type: 'spring', stiffness: 280, damping: 28 } }}
  >
    <Button
      aria-pressed={isSelected}
      className={`h-[68px] w-full rounded-xl border-black/8 bg-black/[0.03] text-[11px] font-semibold uppercase tracking-[0.06em] text-black/70 hover:border-black/18 hover:bg-black/[0.06] dark:border-white/8 dark:bg-white/[0.04] dark:text-white/65 dark:hover:border-white/18 dark:hover:bg-white/[0.07] md:h-[80px]${isShaking ? ' animate-shake' : ''}`}
      onPress={onPress}
      style={
        isSelected
          ? {
              backgroundColor: `rgba(${rgb(selectedColor.background)},var(--tile-sel-bg-a))`,
              borderColor: `rgba(${rgb(selectedColor.background)},var(--tile-sel-bd-a))`,
            }
          : undefined
      }
      variant="outline"
    >
      {word.toUpperCase()}
    </Button>
  </motion.div>
)

export const Toast = ({ message }: { message: string }): React.ReactNode => (
  <span
    className="inline-block rounded-full bg-neutral-800 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
    data-testid="toast"
    role="status"
  >
    {message}
  </span>
)

export const OneAwayRow = ({
  onSelect,
  words,
}: {
  onSelect: (guess: string[]) => void
  words: string[]
}): React.ReactNode => (
  <li>
    <Button
      className="flex h-auto min-h-11 w-full flex-wrap items-center justify-start gap-1.5 whitespace-normal rounded-xl border border-black/20 bg-transparent px-2.5 py-2 hover:border-black/35 hover:bg-black/[0.03] dark:border-white/20 dark:hover:border-white/35 dark:hover:bg-white/[0.04]"
      onPress={() => onSelect(words)}
      variant="outline"
    >
      <span className="sr-only">Select</span>
      {words.map((word) => (
        <span
          className="rounded-md bg-black/[0.04] px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-black/70 dark:bg-white/[0.05] dark:text-white/70"
          key={word}
        >
          {word}
        </span>
      ))}
      <span className="sr-only">again</span>
    </Button>
  </li>
)

export const OneAwayList = ({
  guesses,
  onSelect,
}: {
  guesses: string[][]
  onSelect: (guess: string[]) => void
}): React.ReactNode => (
  <section aria-label="Guesses that were one away" className="mt-6 flex flex-col gap-2">
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/60 dark:text-white/55">
        One away
      </h2>
      <p className="mt-0.5 text-[11.5px] text-black/60 dark:text-white/55">Tap a row to select those words again.</p>
    </div>
    <ul className="flex list-none flex-col gap-1.5 p-0">
      {guesses.map((guess) => (
        <OneAwayRow key={guess.join('\u0000')} onSelect={onSelect} words={guess} />
      ))}
    </ul>
  </section>
)

export const GuardLine = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <p
    className="min-h-5 text-center text-[12.5px] leading-5 text-black/60 dark:text-white/55"
    data-testid="guard-line"
    role="status"
  >
    {children}
  </p>
)

export const ActionsContainer = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="mt-5 flex flex-col gap-3">{children}</div>
)

export const ActionRow = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center">{children}</div>
)

export const ActionButton = (props: React.ComponentProps<typeof Button>): React.ReactNode => (
  <Button {...props} className="w-full max-w-[280px] rounded-full md:w-auto md:min-w-[120px] md:max-w-none" />
)

export const StatLine = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <p className="mt-8 text-center text-[11px] uppercase tracking-[0.15em] text-black/60 dark:text-white/55">
    {children}
  </p>
)

export const GameSelectionWrapper = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="mx-auto mb-16 max-w-[300px] md:mb-20">{children}</div>
)

export const LoadingState = ({ displayGameId }: { displayGameId: string }): React.ReactNode => (
  <div className="px-4 pb-16 pt-8 md:pb-20 md:pt-14" data-testid="loading-skeleton">
    <GameTitle />
    <div className="mb-10 flex justify-center">
      <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-black/60 dark:bg-white/[0.06] dark:text-white/55">
        {displayGameId}
      </span>
    </div>
    <div className="mx-auto mt-4 max-w-[560px] md:mt-6">
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
        {Array.from({ length: 16 }).map((_, index) => (
          <Skeleton className="h-[68px] rounded-xl md:h-[80px]" key={index} />
        ))}
      </div>
      <div className="mt-5 flex flex-col items-center gap-3">
        <Skeleton className="h-10 w-[140px] rounded-full" />
      </div>
      <Skeleton className="mx-auto mt-8 h-4 w-[240px] rounded-full" />
    </div>
  </div>
)

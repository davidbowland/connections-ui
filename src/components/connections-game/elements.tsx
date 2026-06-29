import { Button, Skeleton } from '@heroui/react'
import { motion } from 'framer-motion'
import React from 'react'

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
  <h1 className="mb-3 text-center text-2xl font-light uppercase tracking-[0.2em] text-black/[0.88] dark:text-white/90 sm:text-3xl sm:tracking-[0.3em] md:text-5xl">
    Connections
  </h1>
)

export const GameSubtitle = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="mb-4 flex justify-center">
    <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-black/35 dark:bg-white/[0.06] dark:text-white/30">
      {children}
    </span>
  </div>
)

export const GameInstructions = (): React.ReactNode => (
  <p className="mb-8 text-center text-[11px] tracking-wide text-black/35 dark:text-white/30">
    Group four words that share something in common
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
}): React.ReactNode => (
  <div
    className="mb-2 rounded-xl p-[2px]"
    style={{ backgroundColor: `rgba(${rgb(color.background)},var(--card-bg-outer-a))` }}
  >
    <div
      className="rounded-[10px] px-5 py-3 text-center"
      style={{ backgroundColor: `rgba(${rgb(color.background)},var(--card-bg-inner-a))` }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: color.text }}>
        {description}
      </p>
      <p className="mt-1 text-xs font-light tracking-wide opacity-75" style={{ color: color.text }}>
        {words.join(' · ')}
      </p>
    </div>
  </div>
)

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
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-violet-400/35 text-[10px] text-violet-600 dark:text-purple-200/70">
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
    role="status"
  >
    {message}
  </span>
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
  <p className="mt-8 text-center text-[11px] uppercase tracking-[0.15em] text-black/30 dark:text-white/28">
    {children}
  </p>
)

export const GameSelectionWrapper = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="mx-auto mb-12 max-w-[300px] pt-12">{children}</div>
)

export const LoadingState = ({ displayGameId }: { displayGameId: string }): React.ReactNode => (
  <div className="px-4 pb-16 pt-8 md:pb-20 md:pt-14" data-testid="loading-skeleton">
    <h1 className="mb-3 text-center text-2xl font-light uppercase tracking-[0.2em] text-black/[0.88] dark:text-white/90 sm:text-3xl sm:tracking-[0.3em] md:text-5xl">
      Connections
    </h1>
    <div className="mb-10 flex justify-center">
      <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-black/35 dark:bg-white/[0.06] dark:text-white/30">
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

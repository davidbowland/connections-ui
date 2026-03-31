import {
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertRoot,
  Button,
  ChipLabel,
  ChipRoot,
  Skeleton,
} from '@heroui/react'
import { HelpCircle } from 'lucide-react'
import React from 'react'

import { GameColor } from '@types'

export const GameWrapper = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="p-2 md:p-4">{children}</div>
)

export const GameTitle = (): React.ReactNode => (
  <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight">Connections</h1>
)

export const GameSubtitle = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <p className="mb-2 text-center text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500">{children}</p>
)

export const BoardContainer = ({
  children,
  ref,
}: {
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}): React.ReactNode => (
  <div className="mx-auto mt-4 max-w-[600px] pt-1 md:mt-6" ref={ref}>
    {children}
  </div>
)

export const HintsContainer = ({
  children,
  ref,
}: {
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}): React.ReactNode => <div ref={ref}>{children}</div>

export const HintCard = ({ hint }: { hint: string }): React.ReactNode => (
  <AlertRoot className="mb-4" status="accent">
    <AlertIndicator>
      <HelpCircle className="shrink-0" size={18} />
    </AlertIndicator>
    <AlertContent>
      <AlertDescription>{hint}</AlertDescription>
    </AlertContent>
  </AlertRoot>
)

export const OneAwayMessage = ({ ref }: { ref?: React.Ref<HTMLDivElement> }): React.ReactNode => (
  <div className="mb-4 flex justify-center" ref={ref}>
    <ChipRoot color="warning" size="lg" variant="soft">
      <ChipLabel>One away!</ChipLabel>
    </ChipRoot>
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
  <div className="mb-2 rounded-lg p-4 text-center" style={{ backgroundColor: color.background, color: color.text }}>
    <p className="text-base font-semibold">{description}</p>
    <p className="text-sm opacity-90">{words.join(', ')}</p>
  </div>
)

export const WordGrid = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="grid grid-cols-2 gap-1 md:grid-cols-4">{children}</div>
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
  <Button
    className={`h-[60px] w-full rounded-lg font-bold md:h-[80px] text-xs md:text-sm${isShaking ? ' animate-shake' : ''}`}
    onPress={onPress}
    style={{
      backgroundColor: isSelected ? selectedColor.background : 'transparent',
      color: isSelected ? selectedColor.text : undefined,
    }}
    variant="outline"
  >
    {word}
  </Button>
)

export const ActionsContainer = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="mt-6 flex flex-col gap-4">{children}</div>
)

export const ActionRow = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">{children}</div>
)

export const ActionButton = (props: React.ComponentProps<typeof Button>): React.ReactNode => (
  <Button {...props} className="w-full max-w-[280px] md:w-auto md:min-w-[140px] md:max-w-none" />
)

export const StatLine = ({ children, first }: { children: React.ReactNode; first?: boolean }): React.ReactNode => (
  <p className={`${first ? 'mt-8' : 'mt-2'} text-center text-sm text-gray-500`}>{children}</p>
)

export const GameSelectionWrapper = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="mx-auto mb-12 max-w-[300px] pt-16">{children}</div>
)

export const LoadingState = ({ displayGameId }: { displayGameId: string }): React.ReactNode => (
  <div className="p-2 md:p-4" data-testid="loading-skeleton">
    <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight">Connections</h1>
    <p className="mb-2 text-center text-xs tracking-widest uppercase text-gray-400 dark:text-gray-500">
      {displayGameId}
    </p>
    <div className="mx-auto mt-4 max-w-[600px] md:mt-6">
      <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
        {Array.from({ length: 16 }).map((_, index) => (
          <Skeleton className="h-[60px] rounded md:h-[80px]" key={index} />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
          <Skeleton className="h-9 w-[140px] rounded" />
          <Skeleton className="h-9 w-[140px] rounded" />
        </div>
      </div>
      <Skeleton className="mx-auto mt-8 h-4 w-[150px] rounded" />
      <Skeleton className="mx-auto mt-1 h-4 w-[150px] rounded" />
    </div>
  </div>
)

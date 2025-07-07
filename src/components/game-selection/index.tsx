import { navigate } from 'gatsby'
import React, { useMemo } from 'react'

import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'

import { useGameIds } from '@hooks/useGameIds'
import { GameId } from '@types'

export interface GameSelectionProps {
  gameId: GameId
}

export const GameSelection = ({ gameId }: GameSelectionProps): React.ReactNode => {
  const { errorMessage, gameIds, isLoading } = useGameIds()

  const formattedGameIds = useMemo(
    () =>
      gameIds.map((id) => ({
        id,
        label: new Date(id).toLocaleDateString(navigator.language, {
          day: 'numeric',
          month: 'numeric',
          timeZone: 'UTC',
          year: 'numeric',
        }),
      })),
    [gameIds],
  )

  const handleChange = (event: SelectChangeEvent) => {
    navigate(`/g/${event.target.value}`)
  }

  return (
    <>
      {!isLoading && (
        <FormControl fullWidth>
          <InputLabel id="select-game-label">Select game</InputLabel>
          <Select label="Select game" labelId="select-game-label" onChange={handleChange} value={gameId}>
            {formattedGameIds.map(({ id, label }) => (
              <MenuItem key={id} value={id}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </>
  )
}

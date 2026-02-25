import { askText } from '../cli/promptClient.js'
import { newLabel } from '../constant.js'
import { ImportLabelType } from '../types/index.js'

const getPromptMessage = (field: string, fallback: string): string => {
  return newLabel.find((prompt) => prompt.name === field)?.message ?? fallback
}

export const getNewLabel = async (): Promise<ImportLabelType> => {
  const name = await askText(
    getPromptMessage('name', 'Please type new label name'),
  )
  const color = await askText(
    getPromptMessage('color', 'Please type label color without "#" '),
  )
  const description = await askText(
    getPromptMessage('description', 'Please type label description'),
  )

  return {
    name,
    color,
    description,
  }
}

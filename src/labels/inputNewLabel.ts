import { askText } from '../cli/promptClient.js'
import { newLabel } from '../constant.js'
import { ImportLabelType } from '../types/index.js'

export const getNewLabel = async (): Promise<ImportLabelType> => {
  const name = await askText(newLabel[0].message)
  const color = await askText(newLabel[1].message)
  const description = await askText(newLabel[2].message)

  return {
    name,
    color,
    description,
  }
}

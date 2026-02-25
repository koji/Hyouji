import { askText } from '../cli/promptClient.js'
import { deleteLabel } from '../constant.js'

export const getTargetLabel = async (): Promise<readonly string[]> => {
  const name = await askText(deleteLabel.message)
  if (!name.trim()) {
    throw new Error("Label name can't be empty")
  }
  return [name]
}

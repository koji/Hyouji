import { askText } from '../cli/promptClient.js'
import { deleteLabel } from '../constant.js'

export const getTargetLabel = async (): Promise<readonly string[]> => {
  const name = await askText(deleteLabel.message)
  return [name]
}

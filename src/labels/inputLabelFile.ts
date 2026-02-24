import { askText } from '../cli/promptClient.js'
import { labelFilePath } from '../constant.js'

export const getLabelFilePath = async (): Promise<string> => {
  return askText(labelFilePath.message)
}

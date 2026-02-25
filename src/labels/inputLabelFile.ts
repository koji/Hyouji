import { askText } from '../cli/promptClient.js'
import { labelFilePath } from '../constant.js'

export const getLabelFilePath = async (): Promise<string> => {
  while (true) {
    const filePath = (await askText(labelFilePath.message)).trim()
    if (filePath.length > 0) {
      return filePath
    }
    console.log('File path cannot be empty. Please try again.')
  }
}

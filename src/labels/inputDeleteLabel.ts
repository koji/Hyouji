import chalk from 'chalk'
import { askText } from '../cli/promptClient.js'
import { deleteLabel } from '../constant.js'

export const getTargetLabel = async (): Promise<readonly string[]> => {
  while (true) {
    const name = (await askText(deleteLabel.message)).trim()
    if (name.length > 0) {
      return [name]
    }
    console.log(chalk.yellow('Label name cannot be empty. Please try again.'))
  }
}

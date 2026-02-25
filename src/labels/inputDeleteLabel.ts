import chalk from 'chalk'
import { askText } from '../cli/promptClient.js'
import { deleteLabel } from '../constant.js'

export const getTargetLabel = async (): Promise<readonly string[]> => {
  const name = await askText(deleteLabel.message)
  if (!name.trim()) {
    console.log(chalk.yellow('Label name cannot be empty. Please try again.'))
  }
  return [name]
}

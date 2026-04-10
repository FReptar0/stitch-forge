import chalk from 'chalk';

export const log = {
  info: (msg: string) => console.error(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.error(chalk.green('✓'), msg),
  warn: (msg: string) => console.error(chalk.yellow('⚠'), msg),
  error: (msg: string) => console.error(chalk.red('✗'), msg),
  step: (n: number, total: number, msg: string) =>
    console.error(chalk.dim(`[${n}/${total}]`), msg),
  quota: (model: string, used: number, limit: number) =>
    console.error(chalk.dim(`${model}: ${used}/${limit} used`)),
};

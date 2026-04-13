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

  // ── Hint system ──────────────────────────────────────────────────
  /** Green hint — suggested next action */
  hint: (msg: string) => console.error(chalk.green('→'), chalk.green(msg)),
  /** Red blocker — must be resolved before proceeding */
  blocker: (msg: string) => console.error(chalk.red('■'), chalk.red(msg)),
  /** Yellow/green gate — quality gate pass/fail summary */
  gate: (passed: boolean, msg: string) =>
    console.error(
      passed ? chalk.green('●') : chalk.yellow('●'),
      passed ? chalk.green(msg) : chalk.yellow(msg),
    ),
  /** Blue info hint — non-blocking context (quota, status) */
  status: (msg: string) => console.error(chalk.blue('●'), chalk.dim(msg)),
  /** Render a boxed advisor panel from an array of pre-formatted lines */
  advisor: (lines: string[]) => {
    const maxLen = lines.reduce((m, l) => Math.max(m, stripAnsi(l).length), 0);
    const width = Math.max(maxLen + 2, 40);
    const top = `┌─ ${chalk.bold('Design Guard Status')} ${'─'.repeat(Math.max(0, width - 23))}┐`;
    const bot = `└${'─'.repeat(width + 1)}┘`;
    console.error(top);
    for (const line of lines) {
      const pad = ' '.repeat(Math.max(0, width - stripAnsi(line).length));
      console.error(`│ ${line}${pad}│`);
    }
    console.error(bot);
  },
};

/** Strip ANSI escape codes for length calculation */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

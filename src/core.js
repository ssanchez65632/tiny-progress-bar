const DEFAULT_WIDTH = 20;
const DEFAULT_FILLED = '█';
const DEFAULT_EMPTY = '░';

/**
 * A progress bar that renders to a string. It is designed to be usable even
 * when the output stream is redirected (not a TTY): it never emits carriage
 * returns or ANSI escape sequences, so each call to `toString` produces a
 * complete, self-contained line. Callers that want in-place updates on a TTY
 * are responsible for adding the carriage return themselves.
 *
 * The bar is a value object: `update` returns a new instance rather than
 * mutating in place, which makes it safe to share across async boundaries and
 * trivial to test.
 */
export class ProgressBar {
  /**
   * @param {object} [options]
   * @param {number} [options.total] Total number of units of work. Must be a
   *   non-negative finite number. Defaults to 100.
   * @param {number} [options.width] Number of character cells used by the bar
   *   itself (not counting the percentage or brackets). Must be a positive
   *   integer. Defaults to 20.
   * @param {string} [options.filled] Character used for completed cells.
   * @param {string} [options.empty] Character used for remaining cells.
   * @param {number} [options.value] Initial completed units. Defaults to 0.
   */
  constructor(options = {}) {
    const total = options.total === undefined ? 100 : options.total;
    const width = options.width === undefined ? DEFAULT_WIDTH : options.width;
    const value = options.value === undefined ? 0 : options.value;

    if (typeof total !== 'number' || !Number.isFinite(total) || total < 0) {
      throw new RangeError('total must be a non-negative finite number');
    }
    if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
      throw new RangeError('width must be a positive integer');
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new RangeError('value must be a non-negative finite number');
    }

    this.total = total;
    this.width = width;
    this.filled = options.filled === undefined ? DEFAULT_FILLED : options.filled;
    this.empty = options.empty === undefined ? DEFAULT_EMPTY : options.empty;
    this.value = Math.min(value, total);
  }

  /**
   * Returns a new bar advanced by `amount` units. The amount is added to the
   * current value and clamped to `total`, so callers can overshoot without
   * having to check bounds themselves.
   *
   * @param {number} amount Units to add. Must be a finite number.
   * @returns {ProgressBar}
   */
  update(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new RangeError('amount must be a finite number');
    }
    const next = Math.min(Math.max(this.value + amount, 0), this.total);
    return new ProgressBar({
      total: this.total,
      width: this.width,
      filled: this.filled,
      empty: this.empty,
      value: next,
    });
  }

  /**
   * Fraction complete in the range [0, 1].
   * @returns {number}
   */
  get fraction() {
    if (this.total === 0) {
      return 1;
    }
    return this.value / this.total;
  }

  /**
   * Percentage complete, rounded to the nearest integer. A zero total is
   * treated as complete (100%) because there is no work left to do.
   * @returns {number}
   */
  get percent() {
    return Math.round(this.fraction * 100);
  }

  /**
   * Renders the bar as a single-line string, e.g. `[####      ]  40%`.
   *
   * The number of filled cells is `round(fraction * width)`, which means a
   * non-empty bar always shows at least one filled cell once any progress has
   * been made, and a complete bar always fills every cell. This is a deliberate
   * choice: a bar that shows zero filled cells at 1% looks broken, and a bar
   * that shows one empty cell at 99% looks equally wrong.
   *
   * @returns {string}
   */
  toString() {
    let filledCount = Math.round(this.fraction * this.width);
    if (this.fraction > 0 && filledCount === 0) {
      filledCount = 1;
    }
    if (this.fraction < 1 && filledCount === this.width) {
      filledCount = this.width - 1;
    }
    const emptyCount = this.width - filledCount;
    const bar = this.filled.repeat(filledCount) + this.empty.repeat(emptyCount);
    return `[${bar}] ${String(this.percent).padStart(3)}%`;
  }
}

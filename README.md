# tiny-progress-bar

A zero-dependency progress bar that renders to a plain string, so it works the same whether it is printed to a terminal or piped into a file.

```js
import { ProgressBar } from './src/index.js';

let bar = new ProgressBar({ total: 4, width: 10 });
console.log(bar.toString()); // [░░░░░░░░░░]   0%

bar = bar.update(1);
console.log(bar.toString()); // [███░░░░░░░]  25%

bar = bar.update(1);
console.log(bar.toString()); // [█████░░░░░]  50%

bar = bar.update(2);
console.log(bar.toString()); // [██████████] 100%
```

## Why this exists

Most progress bars assume they are writing to a terminal and emit carriage returns or ANSI escape codes to redraw in place. When stdout is redirected to a file or a pipe, those sequences end up as literal control characters in the output. This library renders each state as a complete, self-contained line and never emits control characters, so the same object can be logged, captured, or displayed without special-casing the destination. The trade-off is that updating in place on a TTY is left to the caller, who can print `\r` before `toString()` if they want that behaviour.

The bar is a value object. `update` returns a new `ProgressBar` instead of mutating the receiver, which keeps the object safe to share and makes the tests trivial to reason about.

## API

### `new ProgressBar(options?)`

- `total` (number, default `100`) — total units of work. Must be a non-negative finite number.
- `width` (number, default `20`) — number of cells in the bar. Must be a positive integer.
- `filled` (string, default `"█"`) — character for completed cells.
- `empty` (string, default `"░"`) — character for remaining cells.
- `value` (number, default `0`) — initial completed units. Clamped to `total`.

Invalid `total`, `width`, or `value` throw a `RangeError`.

### `bar.update(amount)`

Returns a new `ProgressBar` with `amount` added to the current value, clamped to `[0, total]`. `amount` must be a finite number or a `RangeError` is thrown.

### `bar.fraction`

Fraction complete in `[0, 1]`. A `total` of `0` is treated as complete and returns `1`.

### `bar.percent`

`Math.round(fraction * 100)`.

### `bar.toString()`

Renders a line like `[█████░░░░░]  50%`. The percentage is right-aligned to three characters. The number of filled cells is `Math.round(fraction * width)`, so any progress at all shows at least one filled cell, and a complete bar fills every cell.

## The awkward edge

A zero `total` is defined as complete (`fraction === 1`, `percent === 100`). This is the only sensible reading of "no work remains", but it means a bar constructed with `total: 0` renders as a full bar immediately. If you need an empty bar before any work exists, do not create one until you know the total.

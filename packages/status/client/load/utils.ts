export function percentage(value: number, digits = 3) {
  return (value * 100).toFixed(digits) + '%'
}

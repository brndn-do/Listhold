interface DotsProps {
  size?: number;
}
const sizeMap: Record<number, { gap: string; dim: string }> = {
  1: { gap: 'gap-1', dim: 'h-1 w-1' },
  2: { gap: 'gap-2', dim: 'h-2 w-2' },
  3: { gap: 'gap-3', dim: 'h-3 w-3' },
  4: { gap: 'gap-4', dim: 'h-4 w-4' },
  5: { gap: 'gap-5', dim: 'h-5 w-5' },
  6: { gap: 'gap-6', dim: 'h-6 w-6' },
};

const Dots = ({ size = 1 }: DotsProps) => {
  const { gap, dim } = sizeMap[size] ?? sizeMap[1];
  return (
    <div className={`flex ${gap}`}>
      <div
        className={`animate-bounce rounded-full bg-purple-600 [animation-delay:-0.5s] dark:bg-purple-400 ${dim}`}
      />
      <div
        className={`animate-bounce rounded-full bg-purple-600 [animation-delay:-0.25s] dark:bg-purple-400 ${dim}`}
      />
      <div className={`animate-bounce rounded-full bg-purple-600 dark:bg-purple-400 ${dim}`} />
    </div>
  );
};

export default Dots;

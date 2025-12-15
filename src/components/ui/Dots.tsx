interface DotsProps {
  size?: number;
}
const sizeMap: Record<number, { gap: string; dim: string }> = {
  1: { gap: 'gap-1', dim: 'h-1 w-1' },
  2: { gap: 'gap-2', dim: 'h-2 w-2' },
  3: { gap: 'gap-3', dim: 'h-3 w-3' },
  4: { gap: 'gap-4', dim: 'h-4 w-4' },
};

const Dots = ({ size = 1 }: DotsProps) => {
  const { gap, dim } = sizeMap[size] ?? sizeMap[1];
  return (
    <div className={`flex ${gap}`}>
      <div className={`${dim} animate-bounce rounded-full bg-purple-600 [animation-delay:-0.5s]`} />
      <div
        className={`${dim} animate-bounce rounded-full bg-purple-600 [animation-delay:-0.25s]`}
      />
      <div className={`${dim} animate-bounce rounded-full bg-purple-600`} />
    </div>
  );
};

export default Dots;

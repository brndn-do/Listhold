interface DividerProps {
  style?: 'solid' | 'dotted' | 'dashed';
}

const styleClass: Record<NonNullable<DividerProps['style']>, string> = {
  solid: 'border-solid',
  dotted: 'border-dotted',
  dashed: 'border-dashed',
};

const Divider = ({ style = 'solid' }: DividerProps) => {
  return <div className={`w-full border-b ${styleClass[style]} border-gray-500`}></div>;
};

export default Divider;

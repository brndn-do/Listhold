interface LineProps {
  style?: 'solid' | 'dotted' | 'dashed';
}

const Line = ({ style = 'solid' }: LineProps) => {
  return <div className={`w-full border-b-1 border-${style} border-gray-500`}></div>;
};

export default Line;

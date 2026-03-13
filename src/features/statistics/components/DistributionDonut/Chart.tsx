import { type PieSvgProps, ResponsivePie } from '@nivo/pie';

import { type Datum } from './types';

interface Props {
  data: Datum[];
  colors: PieSvgProps<Datum>['colors'];
  tooltip: PieSvgProps<Datum>['tooltip'];
  onClick?: (node: { data: { id: string | number } }) => void;
  animate?: boolean;
}

const PieBlock: React.FC<Props> = ({ data, colors, tooltip, onClick, animate = true }) => {
  if (!data.length) return null;

  return (
    <div className="w-full h-full">
      <ResponsivePie
        sortByValue
        activeOuterRadiusOffset={6}
        animate={animate}
        borderWidth={0}
        colors={colors}
        cornerRadius={3}
        data={data}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        innerRadius={0.6}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        padAngle={0.7}
        tooltip={tooltip}
        valueFormat={(v) => (typeof v === 'number' ? v.toLocaleString() : String(v))}
        onClick={onClick}
      />
    </div>
  );
};

export default PieBlock;

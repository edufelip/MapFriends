import * as React from 'react';
import Svg, { Circle, Path, SvgProps } from 'react-native-svg';

const ReviewPinSvg = (props: SvgProps) => (
  <Svg xmlns="http://www.w3.org/2000/svg" width={64} height={64} viewBox="0 0 64 64" {...props}>
    <Path
      fill="#ef4444"
      stroke="#b91c1c"
      strokeWidth={2}
      d="M32 2C19.85 2 10 11.85 10 24c0 15.18 18.19 35.08 20.27 37.3a2.3 2.3 0 0 0 3.46 0C35.81 59.08 54 39.18 54 24 54 11.85 44.15 2 32 2z"
    />
    <Circle cx={32} cy={25} r={10} fill="#ffffff" />
  </Svg>
);

export default React.memo(ReviewPinSvg);

import React from 'react';

type LayoutCommonProps = React.PropsWithChildren<{
  isAdmin?: boolean;
  style?: React.CSSProperties;
  className?: string;
}>;

const layoutStyled: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  maxWidth: '1300px',
  margin: 'auto',
};

const LayoutCommon: React.FC<LayoutCommonProps> = ({
  children,
  isAdmin = false,
  style,
  ...rest
}) => {
  return (
    <div
      style={{
        ...layoutStyled,
        maxWidth: isAdmin ? 'initial' : layoutStyled.maxWidth,
        ...style,
      }}
      {...rest}
    >
      <div style={{ width: '100%' }}>{children}</div>
    </div>
  );
};

export default LayoutCommon;

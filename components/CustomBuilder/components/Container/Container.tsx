import React, {forwardRef} from 'react';
import {Handle, Remove} from '../Item';
import { StyledActions, StyledContainer, StyledContainerHeader } from './Container.Styled';

export interface Props {
  children: React.ReactNode;
  label?: string;
  style?: React.CSSProperties;
  horizontal?: boolean;
  hover?: boolean;
  handleProps?: React.HTMLAttributes<any>;
  scrollable?: boolean;
  shadow?: boolean;
  placeholder?: boolean;
  onClick?(): void;
  onRemove?(): void;
}

// eslint-disable-next-line react/display-name
export const Container = forwardRef<HTMLDivElement, Props>(
  (
    {
      children,
      handleProps,
      horizontal,
      hover,
      onClick,
      onRemove,
      label,
      placeholder,
      style,
      scrollable,
      shadow,
      ...props
    }: Props,
    ref
  ) => {
    const Component = onClick ? 'button' : 'div';

    return (
      <StyledContainer
        hover={hover}
        isPlaceholder={placeholder}
        isScrollable={scrollable}
        shadow={shadow}

        as={Component}
        {...props}
        ref={ref}
        style={
          {
            ...style,
          } as React.CSSProperties
        }
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
      >
        {label ? (
          <StyledContainerHeader>
            {label}
            <StyledActions>
              {onRemove ? <Remove onClick={onRemove} /> : undefined}
              <Handle {...handleProps} />
            </StyledActions>
          </StyledContainerHeader>
        ) : null}
        {placeholder ? children : <ul>{children}</ul>}
      </StyledContainer>
    );
  }
);

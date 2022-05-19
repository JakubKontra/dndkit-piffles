import styled, { css } from 'styled-components'

export const StyledItemWrapper = styled.h1<{    
    fadeIn: boolean | undefined;
    dragOverlay: boolean | undefined;
}>`
    display: flex;
    box-sizing: border-box;
    transform: translate3d(var(--translate-x, 0), var(--translate-y, 0), 0)
    scaleX(var(--scale-x, 1)) scaleY(var(--scale-y, 1));
    transform-origin: 0 0;
    touch-action: manipulation;

    ${props => props.fadeIn && css`
        animation: fadeIn 500ms ease;
    `}

    ${props => props.dragOverlay && css`
        --scale: 1.05;
        --box-shadow: $box-shadow;
        --box-shadow-picked-up: $box-shadow-border,
        -1px 0 15px 0 rgba(34, 33, 81, 0.01),
        0px 15px 15px 0 rgba(34, 33, 81, 0.25);
        z-index: 999;
    `}

`
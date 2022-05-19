import styled, { css } from 'styled-components'

export const StyledContainer = styled.h1<{    
    hover: boolean | undefined;
    isPlaceholder: boolean | undefined;
    isScrollable: boolean | undefined;
    shadow: boolean | undefined
}>`
    display: flex;
    flex-direction: column;
    grid-auto-rows: max-content;
    overflow: hidden;
    box-sizing: border-box;
    appearance: none;
    outline: none;
    min-width: 350px;
    margin: 10px;
    border-radius: 5px;
    min-height: 200px;
    transition: background-color 350ms ease;
    background-color: rgba(246, 246, 246, 1);
    border: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 1em;

    ul {
        display: grid;
        grid-gap: 10px;
        list-style: none;
        padding: 20px;
        margin: 0;
    }

    ${props => props.isScrollable && css`
        ul {
            overflow-y: auto;
        }
    `}

    ${props => props.isPlaceholder && css`
        justify-content: center;
        align-items: center;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.5);
        background-color: transparent;
        border-style: dashed;
        border-color: rgba(0, 0, 0, 0.08);

        &:hover {
            border-color: rgba(0, 0, 0, 0.15);
        }
    `}

    ${props => props.hover && css`
        background-color: rgb(235, 235, 235, 1);
    `}

    ${props => props.hover && css`
        background-color: rgb(235, 235, 235, 1);
    `}

    ${props => props.shadow && css`
        box-shadow: 0 1px 10px 0 rgba(34, 33, 81, 0.1);
    `}

    &:focus-visible {
        border-color: transparent;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0), 0 0px 0px 2px #4c9ffe;
    }
`
  
export const StyledActions = styled.div`
    display: flex;

    > *:first-child:not(:last-child) {
        opacity: 0;

        &:focus-visible {
            opacity: 1;
        }
    }
`

export const StyledContainerHeader = styled.div`
    display: flex;
    padding: 5px 20px;
    padding-right: 8px;
    align-items: center;
    justify-content: space-between;
    background-color: #fff;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  
    &:hover {
      .${StyledActions} > * {
        opacity: 1 !important;
      }
    }
  }
`
  
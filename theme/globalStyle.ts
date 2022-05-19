import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    // this is the shared style
  html {
    box-sizing: border-box;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

h1 {
    color: yellow !important; // the important is just to show that the style works!
}

  // anything else you would like to include

  
@keyframes pop {
  0% {
    transform: scale(1);
    box-shadow: var(--box-shadow);
  }
  100% {
    transform: scale(var(--scale));
    box-shadow: var(--box-shadow-picked-up);
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

`;
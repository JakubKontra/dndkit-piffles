import type { AppProps } from 'next/app'
import { GlobalStyle } from '../theme/globalStyle'

function MyApp({ Component, pageProps }: AppProps) {
  return <>
  <GlobalStyle />
  <Component {...pageProps} />
  </>
}

export default MyApp

import type { NextPage } from 'next'
import { Builder } from '../components/Builder/Builder'
import { hashedItems } from '../data/data'

const Home: NextPage = () => {
  console.log(hashedItems)
  return (
    <div>
    <Builder />
    </div>
  )
}

export default Home

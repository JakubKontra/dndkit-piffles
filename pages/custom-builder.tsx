import type { NextPage } from 'next'
import { CustomBuilder } from '../components/CustomBuilder/Builder'
import { hashedItems } from '../data/data'

const Home: NextPage = () => {
  return (
    <div>
      <CustomBuilder items={hashedItems} />
    </div>
  )
}

export default Home


'use client'

import { useEffect, useState } from 'react'

import { Hero } from '../Hero/Hero'
import { SpaceExperience } from '../SpaceExperience/SpaceExperience'

export function HeroWrapper() {
  const [spaceOpen, setSpaceOpen] = useState(false)

  useEffect(() => {
    if (!spaceOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [spaceOpen])

  return (
    <>
      <Hero
        onOpenSpace={() => setSpaceOpen(true)}
      />

      <SpaceExperience
        isOpen={spaceOpen}
        onClose={() => setSpaceOpen(false)}
      />
    </>
  )
}


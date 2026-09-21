import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { RarityTier, SkinItem } from '../types'
import { TIER_META } from '../lib/odds'
import {
  rarityCardStyle,
  resolveRarityColor,
  tierCardStyle,
} from '../lib/rarityStyle'

type CommonProps = {
  name: string
  image: string
  footer?: ReactNode
  className?: string
}

type ItemProps = CommonProps & {
  item: Pick<SkinItem, 'rarity'>
  isRareSpecial?: boolean
  tier?: never
}

type TierProps = CommonProps & {
  tier: RarityTier
  item?: never
  isRareSpecial?: never
}

export type SkinRarityCardProps = (ItemProps | TierProps) &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    /** Render as non-interactive div when false. Default true if onClick given. */
    asButton?: boolean
  }

/**
 * Case-contents (and similar) tile with CS2 rarity gradient / glow / vignette.
 */
export function SkinRarityCard({
  name,
  image,
  footer,
  className = '',
  item,
  tier,
  isRareSpecial,
  asButton,
  ...btn
}: SkinRarityCardProps) {
  const color =
    tier != null
      ? TIER_META[tier].color
      : resolveRarityColor(item!, { isRareSpecial })
  const style =
    tier != null
      ? tierCardStyle(tier, { intense: tier === 'rare' || tier === 'covert' })
      : rarityCardStyle(color, {
          intense: !!isRareSpecial || color === '#eb4b4b' || color === '#e4ae39',
        })

  const interactive = asButton ?? typeof btn.onClick === 'function'
  const body = (
    <>
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center w-full">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-20 w-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] pointer-events-none"
        />
        <p className="mt-1.5 text-[11px] text-center line-clamp-2 text-white/85 font-medium leading-snug px-0.5">
          {name}
        </p>
        {footer}
      </div>
    </>
  )

  const baseClass = `relative overflow-hidden rounded-lg border p-2 flex flex-col items-center text-left transition hover:brightness-110 ${
    interactive ? 'cursor-pointer hover:border-accent/50' : ''
  } ${className}`

  if (interactive) {
    return (
      <button type="button" className={baseClass} style={style} {...btn}>
        {body}
      </button>
    )
  }

  return (
    <div className={baseClass} style={style}>
      {body}
    </div>
  )
}

import Image from 'next/image'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<Size, { container: string; text: string; px: number }> = {
  sm:  { container: 'w-8 h-8',   text: 'text-sm',   px: 32  },
  md:  { container: 'w-10 h-10', text: 'text-base',  px: 40  },
  lg:  { container: 'w-16 h-16', text: 'text-2xl',   px: 64  },
  xl:  { container: 'w-24 h-24', text: 'text-3xl',   px: 96  },
}

interface UserAvatarProps {
  nom: string
  avatarUrl?: string | null
  size?: Size
  className?: string
}

export default function UserAvatar({ nom, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const { container, text, px } = sizes[size]
  const initial = nom?.charAt(0)?.toUpperCase() ?? '?'

  if (avatarUrl) {
    return (
      <div className={`${container} rounded-full overflow-hidden shrink-0 ${className}`}>
        <Image
          src={avatarUrl}
          alt={nom}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className={`${container} rounded-full bg-blue-100 flex items-center justify-center shrink-0 ${className}`}>
      <span className={`${text} font-bold text-blue-700 leading-none`}>{initial}</span>
    </div>
  )
}

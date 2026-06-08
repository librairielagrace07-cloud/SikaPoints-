interface LogoProps {
  className?: string
  alt?: string
}

export default function Logo({ className = '', alt = 'SikaPoints' }: LogoProps) {
  return (
    <img
      src="/image.png"
      alt={alt}
      className={className}
      style={{ display: 'block' }}
    />
  )
}

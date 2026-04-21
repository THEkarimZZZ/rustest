import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={cn(
      "bg-white border border-gray-100 rounded-xl",
      hover && "transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200",
      className
    )}>
      {children}
    </div>
  )
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4 border-b border-gray-100", className)}>{children}</div>
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>
}

function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-3 border-t border-gray-100 bg-gray-50/50", className)}>{children}</div>
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter

export { Card }

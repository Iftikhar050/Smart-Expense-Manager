

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div 
      className={`rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initial}
    </div>
  );
}

interface AvatarStackProps {
  members: { id: string, name: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarStack({ members, max = 3, size = 'md', className = '' }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div className={`flex -space-x-2 overflow-hidden ${className}`}>
      {visible.map((m) => (
        <Avatar key={m.id} name={m.name} size={size} className="ring-2 ring-white" />
      ))}
      {overflow > 0 && (
        <div className={`rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold ring-2 ring-white ${sizeClasses[size]}`}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

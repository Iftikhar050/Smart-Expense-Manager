

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const seed = name ? encodeURIComponent(name) : 'default';
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=f1f5f9`;

  return (
    <img 
      src={avatarUrl}
      alt={name}
      className={`rounded-full bg-slate-100 object-cover ${sizeClasses[size]} ${className}`}
      title={name}
    />
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

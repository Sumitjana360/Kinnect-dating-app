import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Navigation = () => {
    const location = useLocation();
    const { user } = useAuth();

    // Don't show navigation on auth or quiz pages
    const hideNavPaths = ['/auth', '/readiness-quiz', '/readiness-result', '/'];
    const shouldHide = hideNavPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

    if (!user || shouldHide) return null;

    const navItems = [
        { path: '/explore', icon: Heart, label: 'Explore' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-lg">
            <div className="flex items-center justify-around h-16 px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path === '/profile' && location.pathname.startsWith('/profile'));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[80px]",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default Navigation;


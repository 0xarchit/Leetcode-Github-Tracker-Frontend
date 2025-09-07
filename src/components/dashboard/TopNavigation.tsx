import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, X, LogOut, GraduationCap } from 'lucide-react';
import { apiService, type Notification } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

interface TopNavigationProps {
  availableTables: string[];
  selectedTable: string | null;
  onTableSelect: (table: string) => void;
  onOpenSettings: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  availableTables,
  selectedTable,
  onTableSelect,
  onOpenSettings,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  // Re-filter when selection or toggle changes
  useEffect(() => {
    const filtered = (showOnlySelected && selectedTable)
      ? allNotifications.filter(n => n.table_name === selectedTable)
      : allNotifications;
    setNotifications(filtered);
  }, [selectedTable, showOnlySelected, allNotifications]);

  const loadNotifications = async () => {
    try {
      const notifs = await apiService.getNotifications();
  setAllNotifications(notifs);
  // Initial filter will be applied by effect
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleDismissNotification = async (notification: Notification) => {
    try {
      await apiService.removeNotification(notification.table_name, notification.rollnumber);
      setNotifications(prev => prev.filter(n => 
        !(n.rollnumber === notification.rollnumber && n.table_name === notification.table_name)
      ));
      toast({
        title: "Notification dismissed",
        description: `Dismissed notification for ${notification.name}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to dismiss notification",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="bg-dashboard-nav border-b border-border shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-dashboard-nav-foreground">Student Tracker</h1>
              <p className="text-sm text-dashboard-nav-foreground/70">Admin Dashboard</p>
            </div>
          </div>

          {/* Center - Table Selector */}
          <div className="flex-1 max-w-xs sm:max-w-md mx-4 sm:mx-8">
            <Select value={selectedTable || ""} onValueChange={onTableSelect}>
              <SelectTrigger className="bg-background border-border text-sm">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right Side - Notifications, Settings, User */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-dashboard-nav-foreground hover:bg-dashboard-nav-foreground/10">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-2 py-2">
                  <DropdownMenuCheckboxItem
                    checked={showOnlySelected}
                    onCheckedChange={(v) => setShowOnlySelected(!!v)}
                    disabled={!selectedTable}
                  >
                    Show only selected class
                  </DropdownMenuCheckboxItem>
                </div>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <>
                    <div className="p-2 font-semibold text-sm border-b">
                      Inactive Students ({notifications.length})
                      {showOnlySelected && selectedTable && (
                        <span className="block text-xs text-muted-foreground mt-1">
                          {selectedTable.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {notifications.map((notification, index) => (
                      <DropdownMenuItem key={index} className="p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.table_name.replace(/_/g, ' ')} • No LeetCode activity 3+ days
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismissNotification(notification);
                          }}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onOpenSettings}
              className="text-dashboard-nav-foreground hover:bg-dashboard-nav-foreground/10"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-dashboard-nav-foreground hover:bg-dashboard-nav-foreground/10">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-foreground">
                      {user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm text-muted-foreground truncate max-w-48">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Removed Input & Label as admin management is no longer handled here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCw, Database, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string | null;
}

// Admin management removed; handled manually in Supabase as requested

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
}) => {
  const [isUpdatingDatabase, setIsUpdatingDatabase] = useState(false);
  const { toast } = useToast();

  const handleForceUpdate = async () => {
    if (!selectedTable) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a table first.",
      });
      return;
    }

    setIsUpdatingDatabase(true);
    try {
      const result = await apiService.updateDatabase(selectedTable);
      toast({
        title: "Database Updated",
        description: `Updated ${result.updated} records in ${result.target_table}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update the database. Please try again.",
      });
    } finally {
      setIsUpdatingDatabase(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
            <span>Admin Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Database Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Database className="h-5 w-5" />
                <span>Database Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Force Update Database</div>
                <p className="text-sm text-muted-foreground">
                  Manually trigger a database update for the selected table to fetch the latest GitHub and LeetCode data.
                </p>
                {selectedTable && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Selected Table:</span> {selectedTable.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                <Button 
                  onClick={handleForceUpdate}
                  disabled={!selectedTable || isUpdatingDatabase}
                  className="w-full"
                >
                  {isUpdatingDatabase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingDatabase ? 'animate-spin' : ''}`} />
                  Force Update Database
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Settings className="h-5 w-5" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">API Status:</span>
                <Badge variant="default" className="bg-success">Connected</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cache Status:</span>
                <Badge variant="secondary">1 Hour TTL</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Version:</span>
                <span className="text-sm">v2.0.0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
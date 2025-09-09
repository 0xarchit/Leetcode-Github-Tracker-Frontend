import React, { useState } from 'react';
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
import { Settings, RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const onClickForceUpdate = () => {
    if (!selectedTable) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a table first.',
      });
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmForceUpdate = () => {
    if (!selectedTable) return;
    // Fire-and-forget: trigger the update without blocking UI
    try {
      void apiService
        .updateDatabase(selectedTable)
        .then(() => {
          // Optional: could update a last-triggered timestamp here
        })
        .catch((err) => {
          console.error('Update request error (non-blocking):', err);
        });
    } catch (err) {
      console.error('Failed to send update request:', err);
    }

    toast({
      title: 'Update request sent',
      description: 'It may take 5–10 minutes to complete. Please check back later.',
    });
    setConfirmOpen(false);
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
                  onClick={onClickForceUpdate}
                  disabled={!selectedTable}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
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
        {/* Confirm Force Update */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Force update database?</AlertDialogTitle>
              <AlertDialogDescription>
                This will trigger a background update for the selected class. It may take 5–10 minutes to finish. You can close this and check back later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmForceUpdate} autoFocus>
                Yes, send update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
import React, { useEffect, useState } from 'react';
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
import { Settings, RefreshCw, Database, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService, type LastUpdateEntry } from '@/services/api';
import { cacheService } from '@/services/cacheService';
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
  const [lastUpdates, setLastUpdates] = useState<LastUpdateEntry[] | null>(null);
  const [loadingLastUpdates, setLoadingLastUpdates] = useState(false);
  const [lastUpdatesError, setLastUpdatesError] = useState<string | null>(null);

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

  const handleClearCache = () => {
    try {
      // Clear only specific cache entries
      cacheService.remove('available_tables');
      if (selectedTable) {
        cacheService.remove(`student_data_${selectedTable}`);
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
    }

    toast({
      title: 'Cache cleared',
      description: 'Selected cache keys cleared. Reloading…',
    });

    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setLoadingLastUpdates(true);
      setLastUpdatesError(null);
      try {
        const data = await apiService.getLastUpdates();
        if (!cancelled) setLastUpdates(data);
      } catch (e) {
        if (!cancelled) setLastUpdatesError('Failed to load last updates');
      } finally {
        if (!cancelled) setLoadingLastUpdates(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isOpen]);

  const formatDateTime = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
  };

  const fromNow = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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

        {/* Cache & Storage */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Trash2 className="h-5 w-5" />
                <span>Cache & Storage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Clears only cached data for the selected class and the available tables list. Theme and last table selection are preserved.
              </p>
              <Button variant="secondary" onClick={handleClearCache} className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Last Updates */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Database className="h-5 w-5" />
                <span>Last Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLastUpdates ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : lastUpdatesError ? (
                <p className="text-sm text-destructive">{lastUpdatesError}</p>
              ) : lastUpdates && lastUpdates.length > 0 ? (
                <div className="divide-y">
                  {lastUpdates.map((entry, idx) => (
                    <div key={`${entry.table_name}-${idx}`} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{entry.table_name.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.changed_at)} ({fromNow(entry.changed_at)})</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No update info available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
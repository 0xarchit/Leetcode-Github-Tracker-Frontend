import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiService, type Student } from '@/services/api';
import TopNavigation from './TopNavigation';
import StudentTable from './StudentTable';
import GithubDetailsModal from './GithubDetailsModal';
import LeetcodeDetailsModal from './LeetcodeDetailsModal';
import SettingsModal from './SettingsModal';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Database } from 'lucide-react';

const Dashboard = () => {
  const LAST_TABLE_KEY = 'student-tracker:last-table';
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Modal states
  const [selectedStudentForGithub, setSelectedStudentForGithub] = useState<Student | null>(null);
  const [selectedStudentForLeetcode, setSelectedStudentForLeetcode] = useState<Student | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadStudentData(selectedTable);
    }
  }, [selectedTable]);

  const loadAvailableTables = async () => {
    try {
      const response = await apiService.getAvailableTables();
      setAvailableTables(response.tables);
      
      // Prefer last selected table from localStorage, else first available
      if (response.tables.length > 0 && !selectedTable) {
        try {
          const saved = localStorage.getItem(LAST_TABLE_KEY);
          if (saved && response.tables.includes(saved)) {
            setSelectedTable(saved);
          } else {
            setSelectedTable(response.tables[0]);
          }
        } catch {
          setSelectedTable(response.tables[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load available tables:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to load available classes. Please check your connection.",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const loadStudentData = async (tableName: string) => {
    setLoading(true);
    try {
      const data = await apiService.getStudentData(tableName);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load student data:', error);
      toast({
        variant: "destructive",
        title: "Data Load Error",
        description: `Failed to load data for ${tableName.replace(/_/g, ' ')}. Please try again.`,
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    try {
      localStorage.setItem(LAST_TABLE_KEY, table);
    } catch {}
  };

  const handleOpenGithubDetails = (student: Student) => {
    setSelectedStudentForGithub(student);
  };

  const handleOpenLeetcodeDetails = (student: Student) => {
    setSelectedStudentForLeetcode(student);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-dashboard-content flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-content">
      <TopNavigation
        availableTables={availableTables}
        selectedTable={selectedTable}
        onTableSelect={handleTableSelect}
        onOpenSettings={handleOpenSettings}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {availableTables.length === 0 ? (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center space-y-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium mb-2">No Classes Available</h3>
                <p className="text-muted-foreground">
                  No student classes were found. Please contact your administrator or check the API connection.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : !selectedTable ? (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center space-y-4 text-center">
              <Database className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium mb-2">Select a Class</h3>
                <p className="text-muted-foreground">
                  Please select a class from the dropdown to view student data.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Loading data for {selectedTable.replace(/_/g, ' ')}...
              </p>
            </CardContent>
          </Card>
        ) : (
          <StudentTable
            students={students}
            onOpenGithubDetails={handleOpenGithubDetails}
            onOpenLeetcodeDetails={handleOpenLeetcodeDetails}
          />
        )}
      </main>

      {/* Modals */}
      <GithubDetailsModal
        student={selectedStudentForGithub}
        isOpen={!!selectedStudentForGithub}
        onClose={() => setSelectedStudentForGithub(null)}
      />
      
      <LeetcodeDetailsModal
        student={selectedStudentForLeetcode}
        isOpen={!!selectedStudentForLeetcode}
        onClose={() => setSelectedStudentForLeetcode(null)}
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedTable={selectedTable}
      />
    </div>
  );
};

export default Dashboard;
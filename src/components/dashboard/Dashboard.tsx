import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiService, type Student } from '@/services/api';
import TopNavigation from './TopNavigation';
import StudentTable from './StudentTable';
import GithubDetailsModal from './GithubDetailsModal';
import LeetcodeDetailsModal from './LeetcodeDetailsModal';
import SettingsModal from './SettingsModal';
import CompareStudentsModal from './CompareStudentsModal';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Database } from 'lucide-react';

const Dashboard = () => {
  const LAST_TABLE_KEY = 'student-tracker:last-table';
  const ALL_CLASSES_KEY = '__all_classes__';
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  
  const [selectedStudentForGithub, setSelectedStudentForGithub] = useState<Student | null>(null);
  const [selectedStudentForLeetcode, setSelectedStudentForLeetcode] = useState<Student | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
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
      
      
      if (response.tables.length > 0 && !selectedTable) {
        try {
          const saved = localStorage.getItem(LAST_TABLE_KEY);
          if (saved && (saved === ALL_CLASSES_KEY || response.tables.includes(saved))) {
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
    
    
    if (tableName === ALL_CLASSES_KEY) {
      try {
        const allStudentsData: Student[] = [];
        const classesToFetch: string[] = [];
        
        
        for (const className of availableTables) {
          try {
            const cachedData = await apiService.getStudentData(className, {
              cacheOnly: true,
              skipCacheValidation: true,
            });
            if (cachedData && cachedData.length > 0) {
              
              const dataWithSection = cachedData.map(student => ({
                ...student,
                section: className.replace(/_/g, " "),
              }));
              allStudentsData.push(...dataWithSection);
            } else {
              classesToFetch.push(className);
            }
          } catch {
            classesToFetch.push(className);
          }
        }
        
        
        if (classesToFetch.length > 0) {
          const fetchPromises = classesToFetch.map(className =>
            apiService.getStudentData(className).then(data => ({
              className,
              data: data || [],
            })).catch(() => ({
              className,
              data: [] as Student[],
            }))
          );
          
          const fetchedResults = await Promise.all(fetchPromises);
          fetchedResults.forEach(({ className, data }) => {
            if (data && data.length > 0) {
              
              const dataWithSection = data.map(student => ({
                ...student,
                section: className.replace(/_/g, " "),
              }));
              allStudentsData.push(...dataWithSection);
            }
          });
        }
        
        setStudents(allStudentsData);
      } catch (error) {
        console.error('Failed to load all classes data:', error);
        toast({
          variant: "destructive",
          title: "Data Load Error",
          description: `Failed to load data for all classes. Please try again.`,
        });
        setStudents([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    
    try {
      
      const cachedData = await apiService.getStudentData(tableName, {
        cacheOnly: true,
        skipCacheValidation: true,
      });
      
      if (cachedData && cachedData.length > 0) {
        setStudents(cachedData);
        setLoading(false);
        
        
        apiService.getStudentData(tableName).then(freshData => {
          if (freshData && freshData.length > 0) {
            setStudents(freshData);
          }
        }).catch(() => {
          
        });
      } else {
        
        const data = await apiService.getStudentData(tableName);
        setStudents(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
      toast({
        variant: "destructive",
        title: "Data Load Error",
        description: `Failed to load data for ${tableName.replace(/_/g, ' ')}. Please try again.`,
      });
      setStudents([]);
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

  const handleOpenCompare = () => {
    setIsCompareOpen(true);
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
        onOpenCompare={handleOpenCompare}
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
            selectedTable={selectedTable}
          />
        )}
      </main>

      {}
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

      <CompareStudentsModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        students={students}
      />
    </div>
  );
};

export default Dashboard;
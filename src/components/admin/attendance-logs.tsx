"use client";

import { useState, useEffect } from "react";
import { getAdminDashboard, AttendanceRecord } from "@/services/attendance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClipboardList, Clock, User, AlertCircle } from "lucide-react";

interface AttendanceLogsProps {
  roomId: string;
}

export function AttendanceLogs({ roomId }: AttendanceLogsProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchLogs();
    }
  }, [roomId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAdminDashboard(roomId);
      setLogs(data);
    } catch (error: any) {
      toast.error("Failed to fetch attendance logs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading attendance logs...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => !l.time_out).length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₱{logs.reduce((acc, curr) => acc + (curr.fines || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50">
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Student</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Student ID</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Time In</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Time Out</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Fines</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                    No attendance records found for this room.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {log.profiles?.full_name || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.profiles?.student_id || "N/A"}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(log.time_in).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.time_out ? new Date(log.time_out).toLocaleTimeString() : "--:--"}
                    </TableCell>
                    <TableCell>
                      <span className={log.fines > 0 ? "text-destructive font-bold" : "text-muted-foreground"}>
                        ₱{log.fines || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!log.time_out ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                          Completed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

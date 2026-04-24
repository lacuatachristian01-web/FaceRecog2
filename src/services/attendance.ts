"use server";

import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/supabase';

export type AttendanceRecord = Database['public']['Tables']['attendance']['Row'];

/**
 * Attendance Service
 * Handles time-in, time-out, and dashboard data.
 */

export async function timeIn(roomId: string, studentId: string) {
  const supabase = await createClient();
  
  // 1. Check if already timed in today for this room
  const today = new Date().toISOString().split('T')[0];
  
  const { data: existing, error: checkError } = await supabase
    .from('attendance')
    .select('id')
    .eq('room_id', roomId)
    .eq('student_id', studentId)
    .gte('time_in', `${today}T00:00:00`)
    .is('time_out', null)
    .single();

  if (existing) throw new Error('Already timed in');

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      room_id: roomId,
      student_id: studentId,
      time_in: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function timeOut(roomId: string, studentId: string) {
  const supabase = await createClient();
  
  // 1. Find the active time-in session
  const { data: session, error: findError } = await supabase
    .from('attendance')
    .select('id')
    .eq('room_id', roomId)
    .eq('student_id', studentId)
    .is('time_out', null)
    .order('time_in', { ascending: false })
    .limit(1)
    .single();

  if (findError || !session) throw new Error('No active session found to time out');

  const { data, error } = await supabase
    .from('attendance')
    .update({
      time_out: new Date().toISOString(),
    })
    .eq('id', session.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminDashboard(roomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify ownership of the room
  const { data: room } = await supabase
    .from('rooms')
    .select('admin_id')
    .eq('id', roomId)
    .single();

  if (room?.admin_id !== user.id) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      profiles:student_id (
        full_name,
        student_id
      )
    `)
    .eq('room_id', roomId)
    .order('time_in', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudentAttendance(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      rooms (name)
    `)
    .eq('student_id', studentId)
    .order('time_in', { ascending: false });

  if (error) throw error;
  return data;
}

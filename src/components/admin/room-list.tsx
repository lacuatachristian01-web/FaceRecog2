"use client";

import { useState, useEffect } from "react";
import { createRoom, getAdminRooms, Room } from "@/services/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Users, Hash, Calendar } from "lucide-react";

export function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await getAdminRooms();
      setRooms(data);
    } catch (error: any) {
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName) return;

    setCreating(true);
    try {
      await createRoom(newRoomName);
      setNewRoomName("");
      toast.success("Room created successfully");
      fetchRooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading rooms...</div>;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Create New Room</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoom} className="flex gap-4">
            <Input
              placeholder="Room Name (e.g., BSCS 4A)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="bg-background border-input text-foreground focus-visible:ring-ring"
            />
            <Button type="submit" disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              {creating ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No rooms created yet.
          </div>
        ) : (
          rooms.map((room) => (
            <Card key={room.id} className="border-border bg-card hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  {room.name}
                  <div className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">
                    {room.code}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Code: <span className="font-bold text-foreground">{room.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created: {new Date(room.created_at).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground" onClick={() => window.location.href = `/admin/rooms/${room.id}`}>
                  View Dashboard
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

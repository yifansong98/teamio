import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const TeamContext = createContext();

export const TeamContextProvider = ({ children }) => {
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Set teamId when user logs in
  useEffect(() => {
    if (user) {
      // Try to get teamId from localStorage first
      const storedTeamId = localStorage.getItem("teamId");
      if (storedTeamId) {
        setTeamId(storedTeamId);
        console.log("TeamContext: Set teamId from localStorage:", storedTeamId);
      } else {
        // Fetch user's team_id from backend
        fetchUserTeamId(user.email);
      }
    } else {
      // Clear teamId when user logs out
      setTeamId('');
      localStorage.removeItem("teamId");
      console.log("TeamContext: Cleared teamId on logout");
    }
  }, [user]);

  const fetchUserTeamId = async (email) => {
    setLoading(true);
    try {
      console.log("TeamContext: Fetching team_id for user:", email);
      const response = await fetch(`http://localhost:3000/api/users/?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const userData = await response.json();
        const userTeamId = userData.team_id;
        
        if (userTeamId) {
          setTeamId(userTeamId);
          localStorage.setItem("teamId", userTeamId);
          console.log("TeamContext: Set teamId from backend:", userTeamId);
        } else {
          console.warn("TeamContext: No team_id found for user:", email);
          // Fallback to default team
          const defaultTeamId = 'vitals';
          setTeamId(defaultTeamId);
          localStorage.setItem("teamId", defaultTeamId);
          console.log("TeamContext: Set default teamId as fallback:", defaultTeamId);
        }
      } else {
        console.error("TeamContext: Failed to fetch user data:", response.status);
        // Fallback to default team
        const defaultTeamId = 'vitals';
        setTeamId(defaultTeamId);
        localStorage.setItem("teamId", defaultTeamId);
        console.log("TeamContext: Set default teamId as fallback:", defaultTeamId);
      }
    } catch (error) {
      console.error("TeamContext: Error fetching user team_id:", error);
      // Fallback to default team
      const defaultTeamId = 'vitals';
      setTeamId(defaultTeamId);
      localStorage.setItem("teamId", defaultTeamId);
      console.log("TeamContext: Set default teamId as fallback:", defaultTeamId);
    } finally {
      setLoading(false);
    }
  };

  const updateTeamId = (newTeamId) => {
    setTeamId(newTeamId);
    localStorage.setItem("teamId", newTeamId);
    console.log("TeamContext: Updated teamId to:", newTeamId);
  };

  return (
    <TeamContext.Provider value={{ teamId, updateTeamId, loading }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamContextProvider');
  }
  return context;
};

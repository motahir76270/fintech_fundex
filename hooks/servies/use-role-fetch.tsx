import { Alert } from "react-native";
import { getSateRole } from "../authApi/authapi";
import { setRoleState } from "@/redux/services/serviceSlice";



export const fetchRole = async (dispatch:any, userRoleId:any ) => {
    try {
      const res = await getSateRole();
      if (res?.status === "SUCCESS") {
        const roles = res?.data?.roles;
        
        // Check if roles array exists and has items
        if (roles && Array.isArray(roles) && roles.length > 0) {
          // Convert both IDs to strings or numbers for comparison
          const matchedRole = roles.find((role: any) => {
            // Convert both to string to ensure proper comparison
            const roleId = Number(role.id);
            const currentRoleId = Number(userRoleId);
            return roleId === currentRoleId;
          });
          
          
          if (matchedRole) {
            dispatch(setRoleState(matchedRole.name));
          } else {
            // If no match found, check if userRoleId exists in roles array by value
            const roleExists = roles.some((role: any) => String(role.id) === String(userRoleId));
            if (!roleExists && userRoleId) {
              console.log("User role ID not found in roles list");
            }
        
          }
        }
      } else {
        Alert.alert(res?.status || "Error", res?.message || "Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  };
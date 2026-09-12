import { createContext, useContext } from "react";
import type { StaffRole } from "./use-admin";

const StaffRoleContext = createContext<StaffRole>("none");

export const StaffRoleProvider = StaffRoleContext.Provider;

/** Текущая служебная роль внутри админ-панели. */
export function useCurrentStaffRole() {
  return useContext(StaffRoleContext);
}

/** Заявки и другие персональные данные доступны только координатору. */
export function useCanSeePersonalData() {
  return useCurrentStaffRole() === "admin";
}

export function checkAdminAuth(): boolean {
  const admin = localStorage.getItem("docmaster_admin_login");
  if (!admin) return false;
  try {
    const parsed = JSON.parse(admin);
    return parsed?.role?.toUpperCase() === "ADMIN" && !!parsed?.token;
  } catch {
    return false;
  }
}
